import { Format } from "./format"

export type Options = {
	// Images will be written to this directory
	dir: string

	// Indermediate images will be cached here
	cacheDir: string

	// Each image will be resized to these specific widths for
	// the srcset.
	widths: number[]

	// Each image will be transformed into these formats
	formats?: Format[]

	// The max number of images to process at the same time
	concurrency?: number

	// The quality at which to generate images
	quality?: number

	// Generate the url based on the filename in dir
	url?: (filename: string) => string
}

export type FullOptions = Required<Options>

export function defaults(options: Options): FullOptions {
	return {
		formats: ["jpeg", "webp"],
		concurrency: 10,
		quality: 80,
		url(filename: string): string {
			return `/${filename}`
		},
		...options,
	}
}
