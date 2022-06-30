import { EventEmitter } from "events"

import { Format } from "./format"

export type Events = {
	initialized: {}
	transform: {
		filename: string
		width: number
		format: Format
		src: string
		cached: boolean
	}
	read: {
		filename: string
	}
}

export type Handler<Evt> = (evt: Evt) => void
export type EventName = keyof Events

export class Emitter extends EventEmitter {
	_on<T extends EventName>(name: EventName, handler: Handler<Events[T]>): Emitter {
		super.on(name, handler)
		return this
	}

	_emit<T extends EventName>(name: EventName, evt: Events[T]): void {
		super.emit(name, evt)
	}
}
