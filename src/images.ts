import path from "path"
import { promises as fs, createWriteStream } from "fs"

import Queue from "promise-queue"
import sharp from "sharp"

import { Format } from "./format"
import { ImageData, ImageSource } from "./image"
import { hash, contenthash } from "./hash"
import { Options, FullOptions, defaults } from "./options"
import { exists } from "./exists"
import { Emitter, EventName, Handler, Events } from "./events"

type Info = {
	width: number
	height: number
	lightness: number
}

type SourceDef = {
	format: Format
	width: number
}

export class ImageGen {
	options: FullOptions
	matrix: SourceDef[]
	queue: Queue
	initialize: Promise<void>
	emitter: Emitter

	constructor(options: Options) {
		this.options = defaults(options)
		this.queue = new Queue(10, 1000)

		this.matrix = this.options.widths.flatMap((width: number) =>
			this.options.formats.map(
				(format: Format): SourceDef => ({
					format,
					width,
				}),
			),
		)

		this.emitter = new Emitter()
		this.initialize = this._initialize()
	}

	async read(filename: string): Promise<ImageData> {
		await this.initialize

		this.emitter._emit("read", { filename })

		const image = sharp(filename)
		const hash = await contenthash(filename)
		const info = await this._info(image, hash)
		const matrix = await Promise.all(
			this.matrix.map((def: SourceDef) => this.queue.add(() => this._transform(filename, hash, def))),
		)

		return {
			key: hash,
			...info,
			matrix,
			filename: path.basename(filename),
		}
	}

	async _info(img: sharp.Sharp, hash: string): Promise<Info> {
		const file = path.resolve(this.options.cacheDir, hash, "info.json")
		try {
			const data = await fs.readFile(file, "utf-8")
			return JSON.parse(data)
		} catch (err) {
			// @ts-expect-error: Error.code exists on fs errors
			if (!(err instanceof Error) || err?.code !== "ENOENT") {
				throw err
			}

			return this.queue.add(async function (): Promise<Info> {
				const meta = await img.metadata()
				const stats = await img.stats()
				const lightness = (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3

				const info = {
					width: meta.width ?? 0,
					height: meta.height ?? 0,
					lightness,
				}

				await fs.mkdir(path.dirname(file), { recursive: true })
				await fs.writeFile(file, JSON.stringify(info))
				return info
			})
		}
	}

	async _transform(filename: string, h: string, def: SourceDef): Promise<ImageSource> {
		const img = sharp(filename)
		img.resize({ width: def.width })

		if (def.format === "jpeg") {
			img.jpeg({ progressive: true, quality: this.options.quality })
		}

		if (def.format === "webp") {
			img.webp({ quality: this.options.quality, alphaQuality: 50 })
		}

		if (def.format === "avif") {
			img.avif({ quality: this.options.quality })
		}

		const optshash = hash(`w${def.width}:q${def.format}:f${this.options.quality}`, 4)
		const src = `${h}.${optshash}.w${def.width}.q${this.options.quality}.${def.format}`
		const dest = path.resolve(this.options.dir, src)

		const source: ImageSource = {
			...def,
			src: this.options.url(src),
		}

		const cached = await exists(dest)
		this.emitter._emit("transform", { filename, ...source, cached })
		if (cached) {
			return source
		}

		const out = createWriteStream(dest)

		return new Promise(function (resolve, reject) {
			img.on("end", () => resolve(source))
			img.on("error", (err: Error) => reject(err))
			img.pipe(out)
		})
	}

	async _initialize(): Promise<void> {
		await fs.mkdir(this.options.dir, { recursive: true })
		this.emitter._emit("initialized", {})
	}

	on<T extends EventName>(name: EventName, handler: Handler<Events[T]>): void {
		this.emitter._on(name, handler)
	}
}
