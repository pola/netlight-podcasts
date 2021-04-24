import {axiosGet, axiosPost} from '@/utils/rest-access'



export async function getPodcasts() {
    let url = '/podcasts'

    return axiosGet(url)
}
export async function getPodcast(slug) {
    return axiosGet(('/podcasts/' + slug))
}


export async function postNewEpisode(title, podcastId = '8V6EH59W') {
    const url = 'admin/podcasts/'+podcastId+'/episodes'
    const params = {title: title}
    return axiosPost(url, params)
}
