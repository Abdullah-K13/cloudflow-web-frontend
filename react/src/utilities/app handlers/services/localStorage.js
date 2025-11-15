export class LocalStorage {

    get = (key, parse = true) => {
        let data = localStorage.getItem(key)
        if (data) {
            if (parse)
                return JSON.parse(data)
            else
                return data
        }
        else return null
    }

    set = (key, data, stringify = true) => {
        data = data || {}
        if (stringify)
            localStorage.setItem(key, JSON.stringify(data))
        else
            localStorage.setItem(key, data)
    }

    clear = () => localStorage.clear()

    remove = (key) => localStorage.removeItem(key)

}