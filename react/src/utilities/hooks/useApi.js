import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../integration/apiClient';
import { catchAsyncErrors } from '../../integration/handlers/async.handler';
import { responseHandler } from '../../integration/handlers/response.handler';
import { message } from 'antd';

export const API_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
}

export const useApi = ({
    method,
    endpoint,
    enabled = true,
    queryParams,
    body,
    invalidateKey,
    customOptions = {},
    queryOptions = {},
    onSuccess = () => { }
}) => {
    const queryClient = useQueryClient();

    const client = apiClient(customOptions); // use custom headers/options here

    const queryFn = catchAsyncErrors(async () => {
        let result = await client.get(endpoint, { params: queryParams })
        return await responseHandler(result)
    })

    const mutationFn = catchAsyncErrors(async () => {
        switch (method) {
            case API_METHODS.POST:
                return (await client.post(endpoint, body)).data;
            case API_METHODS.PUT:
                return (await client.put(endpoint, body)).data;
            case API_METHODS.DELETE:
                return (await client.delete(endpoint, { data: body })).data;
            default:
                throw new Error(`Unsupported method: ${method}`, { cause: method });
        }
    });

    if (method === API_METHODS.GET) {
        return useQuery({
            queryKey: [endpoint, queryParams],
            queryFn,
            enabled,
            onSuccess,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchInterval: false,
            retry: false,
            ...queryOptions
        });
    }

    return useMutation({
        mutationFn,
        onSuccess: () => {
            if (invalidateKey) {
                queryClient.invalidateQueries({ queryKey: [invalidateKey] });
            }
            onSuccess()
        },

    });
};
