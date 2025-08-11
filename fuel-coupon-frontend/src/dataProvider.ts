// src/dataProvider.ts
import { fetchUtils } from 'react-admin';
import { stringify } from 'query-string';

const apiUrl = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api/v1`
  : (import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1');
const httpClient = fetchUtils.fetchJson;

export const dataProvider = {
  getList: (resource: string, params: any) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = {
      ...fetchUtils.flattenObject(params.filter),
      _start: (page - 1) * perPage,
      _end: page * perPage,
      _sort: field,
      _order: order,
    };
    const url = `${apiUrl}/${resource}/?${stringify(query)}`;

    return httpClient(url).then(({ headers, json }) => ({
      data: json,
      total: parseInt(headers.get('x-total-count') || '0', 10),
    }));
  },

  getOne: (resource: string, params: any) =>
    httpClient(`${apiUrl}/${resource}/${params.id}/`).then(({ json }) => ({
      data: json,
    })),

  getMany: (resource: string, params: any) => {
    const query = {
      id: params.ids,
    };
    const url = `${apiUrl}/${resource}/?${stringify(query)}`;
    return httpClient(url).then(({ json }) => ({ data: json }));
  },

  getManyReference: (resource: string, params: any) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = {
      ...fetchUtils.flattenObject(params.filter),
      [params.target]: params.id,
      _start: (page - 1) * perPage,
      _end: page * perPage,
      _sort: field,
      _order: order,
    };
    const url = `${apiUrl}/${resource}/?${stringify(query)}`;

    return httpClient(url).then(({ headers, json }) => ({
      data: json,
      total: parseInt(headers.get('x-total-count') || '0', 10),
    }));
  },

  update: (resource: string, params: any) =>
    httpClient(`${apiUrl}/${resource}/${params.id}/`, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({ data: json })),

  updateMany: (resource: string, params: any) => {
    return Promise.all(
      params.ids.map((id: any) =>
        httpClient(`${apiUrl}/${resource}/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(params.data),
        })
      )
    ).then(responses => ({ data: responses.map(({ json }) => json.id) }));
  },

  create: (resource: string, params: any) =>
    httpClient(`${apiUrl}/${resource}/`, {
      method: 'POST',
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({
      data: { ...params.data, id: json.id },
    })),

  delete: (resource: string, params: any) =>
    httpClient(`${apiUrl}/${resource}/${params.id}/`, {
      method: 'DELETE',
    }).then(({ json }) => ({ data: json })),

  deleteMany: (resource: string, params: any) => {
    return Promise.all(
      params.ids.map((id: any) =>
        httpClient(`${apiUrl}/${resource}/${id}/`, {
          method: 'DELETE',
        })
      )
    ).then(responses => ({ data: responses.map(({ json }) => json.id) }));
  },
};