import apiClient from './index';

export const RecentActivityService = {
  async getSubCenterActivity(subCenterId: string) {
    const response = await apiClient.get(`/subcenters/${subCenterId}/recent-activity/`);
    return response.data;
  },
};
