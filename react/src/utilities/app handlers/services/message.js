import { message } from "antd"

export class Messages {

    success = (text) => {
        message.destroy()
        message.success(text)
    }

    error = (text) => {
        message.destroy()
        message.error(text)
    }

    info = (text) => {
        message.destroy()
        message.info(text)
    }

    loading = (text) => {
        message.destroy()
        message.loading(text)
    }

}