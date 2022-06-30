import fs from "fs"
import crypto from "crypto"
import { Readable } from "stream"

import base from "base-x"

const defaultLength = 8
const alg = "sha1"
const alphabet = "_-0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz"
const encoding = base(alphabet)

function encode(digest: Buffer, len = defaultLength): string {
	const str = encoding.encode(digest)
	return str.substring(0, len)
}

/**
 * Returns a hash based on of the value of a string or object.
 * If x is an object, a hash of a unique representation of the object is given.
 */
export function hash(x: string | Buffer, len = defaultLength): string {
	return bufhash(x, len)
}

/**
 * Return the hash of the content of a file on the filesystem.
 */
export function contenthash(filename: string, len = defaultLength): Promise<string> {
	const strm = fs.createReadStream(filename)
	return streamhash(strm, len)
}

/**
 * Return the hash of a buffer or string.
 */
export function bufhash(buf: string | Buffer, len = defaultLength): string {
	const h = crypto.createHash(alg)
	h.update(buf)
	const digest = h.digest()
	return encode(digest, len)
}

/**
 * Create a hash of the content of a stream.
 */
export function streamhash(strm: Readable, len = defaultLength): Promise<string> {
	return new Promise(function (resolve) {
		const h = crypto.createHash(alg)

		strm.on("end", function () {
			const digest = h.digest()
			const res = encode(digest, len)
			resolve(res)
		})

		strm.pipe(h)
	})
}

/**
 * Create a hash of the content of a file.
 */
export async function filehash(path: string, len = defaultLength): Promise<string> {
	const strm = fs.createReadStream(path)
	return streamhash(strm, len)
}
