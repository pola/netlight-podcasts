import {axiosGet} from '@/utils/rest-access'

export async function getPodcasts() {
    return axiosGet('/podcasts')
}

