import { Format } from "./format"

export type ImageData = {
	key: string
	filename: string
	width: number
	height: number
	lightness: number
	matrix: ImageSource[]
}

export type ImageSource = {
	format: Format
	width: number
	src: string
}
