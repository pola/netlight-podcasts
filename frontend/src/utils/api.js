import {axiosGet} from '@/utils/rest-access'



export async function getPodcasts() {
    return axiosGet('/podcasts')
}
export async function getPodcast(slug) {
    return axiosGet(('/podcasts/' + slug))
}

