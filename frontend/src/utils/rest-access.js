import axios from 'axios'

export async function axiosGet(url) {
    return axios.get(url)
        .then(response => {
            return response.data
        })
        .catch(e => {
            console.log(e)
        })
}
export async function axiosPost(url, data) {
    return axios.post(url, data)
        .then(response => {
            return response
        })
        .catch(e => {
            console.log(e)
        })
}