import { ImageData, ImageSource } from "../image"

export type SrcSet = {
	srcSet: string
	src: string
}

export function byWidth(a: ImageSource, b: ImageSource) {
	return a.width - b.width
}

/**
 * Build the srcSet for a given format from the images matrix
 *
 * Returns null if no image with the selected format was found.
 */
export function srcset(format: string, image: ImageData): SrcSet | null {
	const res = []
	const srces = image.matrix.filter((src) => src.format === format).sort(byWidth)

	if (srces.length === 0) {
		return null
	}

	for (const src of srces) {
		res.push(`${src.src} ${src.width}w`)
	}

	return {
		src: srces[0]?.src,
		srcSet: res.join(", "),
	}
}
