import * as React from "react"
import { ImageData } from "../image"

import { srcset } from "./srcset"

type Props = {
	image: ImageData
	sizes: string
	className?: string
	loading?: "lazy" | "eager"
}

type SourceProps = {
	image: ImageData
	type: string
	sizes: string
}

export const Picture = React.memo(function Image(props: Props) {
	const { image, loading = "lazy", className, sizes, ...rest } = props

	return (
		<picture className={className}>
			<Source type="image/avif" sizes={sizes} image={image} />
			<Source type="image/webp" sizes={sizes} image={image} />
			<img {...rest} sizes={sizes} {...srcset("jpeg", image)} loading={loading} />
		</picture>
	)
})

const Source = React.memo(function Source(props: SourceProps): React.ReactElement | null {
	const { image, type } = props
	const format = type.replace("image/", "")
	const s = srcset(format, image)
	if (!s) {
		return null
	}

	return <source {...props} {...s} />
})
