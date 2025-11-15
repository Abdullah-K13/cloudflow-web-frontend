import { LocalStorage } from "./localStorage"
import { Messages } from "./message"

export * from "./preReq"


const Message = new Messages()
const Storage = new LocalStorage()

export { Message, Storage }