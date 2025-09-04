// src/pages/parliament/BeneficiaryManagement.tsx
import { useState, useCallback, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Input,
  InputNumber,
  Select,
  Modal,
  Form,
  Upload,
  Progress,
  Statistic,
  Row,
  Col,
  Tooltip,
  Avatar,
  Typography,
  Badge,
  Drawer,
  Descriptions,
  Timeline,
  Alert,
  Tabs,
  List,
  Empty,
  Image,
  message,
  notification,
} from 'antd';

const { Option } = Select;
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined,
  UserOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  CarOutlined,
  FileTextOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  StopOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import BeneficiaryService, { type Beneficiary, type BeneficiaryListResponse } from '@/api/beneficiaries';
import apiClient from '@/api';

const { Search } = Input;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface BeneficiaryFilters {
  search?: string;
  category?: string;
  status?: string;
  constituency?: string;
  party?: string;
}

const BeneficiaryManagement = () => {
  const [filters, setFilters] = useState<BeneficiaryFilters>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();

  // --- Category filter and multi-select logic ---
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);

  // Pagination for beneficiaries
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState<number>(0);

  // Fetch beneficiaries data (server-side pagination)
  const { data: beneficiariesResponse, isLoading, refetch } = useQuery<BeneficiaryListResponse>({
    queryKey: ['beneficiaries', filters, page, pageSize],
    queryFn: async () => {
      const params: any = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.party) params.party = filters.party;
      params.page = page;
      params.page_size = pageSize;

      return await BeneficiaryService.getBeneficiaries(params);
    },
    placeholderData: (previousData) => previousData,
  });

  // Fetch ALL beneficiaries for statistics (no pagination)
  const { data: allBeneficiariesResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['all-beneficiaries-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/beneficiaries/?page_size=1000'); // Get all for statistics
      console.log('All beneficiaries for stats:', response.data);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2
  });

  // Get all beneficiaries for statistics calculations
  const allBeneficiaries = allBeneficiariesResponse?.results || allBeneficiariesResponse || [];

  // Extract unique categories from all beneficiaries for filter
  const beneficiaryFilterCategories = Array.from(new Set(allBeneficiaries.map((b: any) => typeof b.category === 'object' ? b.category?.name : b.category).filter(Boolean))) as string[];

  // Filter beneficiaries by selected category
  const filteredBeneficiaries = selectedCategory
    ? allBeneficiaries.filter((b: any) => {
        const cat = typeof b.category === 'object' ? b.category?.name : b.category;
        return cat === selectedCategory;
      })
    : allBeneficiaries;

  // Fetch constituencies for dropdowns
  const { data: constituenciesData, isLoading: constituenciesLoading } = useQuery({
    queryKey: ['constituencies'],
    queryFn: async () => {
      // Fetch all constituencies with large page_size
      const response = await apiClient.get('/constituencies/?page_size=1000');
      const data = response.data;
      return Array.isArray(data) ? data : (data.results || []);
    },
  });

  // Fetch political parties for dropdowns
  const { data: politicalPartiesData, isLoading: partiesLoading } = useQuery({
    queryKey: ['political-parties-active'],
    queryFn: async () => {
      const response = await apiClient.get('/political-parties/active_parties/');
      const data = response.data;
      // Handle both paginated response and direct array
      return Array.isArray(data) ? data : (data.results || []);
    },
  });

  // Fetch system users with BENEFICIARY role for dropdowns
  const { data: systemUsersData, isLoading: usersLoading } = useQuery({
    queryKey: ['system-users-beneficiaries'],
    queryFn: async () => {
      const response = await apiClient.get('/users/?role=BENEFICIARY&page_size=100');
      const data = response.data;
      // Handle both paginated response and direct array
      return Array.isArray(data) ? data : (data.results || []);
    },
  });

  // Fetch beneficiary categories from backend
  const { data: beneficiaryCategoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['beneficiary-categories'],
    queryFn: async () => {
      // Fetch all categories with very large page_size to ensure we get all categories
      const response = await apiClient.get('/beneficiary-categories/?page_size=1000');
      console.log('All beneficiary categories:', response.data);
      const data = response.data;
      return Array.isArray(data) ? data : (data.results || []);
    },
    // allow React Query to cache default; keep default staleTime to avoid unnecessary re-fetches
  });

  // Fetch unique categories from all beneficiaries for better filtering
  const { data: uniqueCategoriesData } = useQuery({
    queryKey: ['unique-beneficiary-categories'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/beneficiaries/unique-categories/');
        return response.data.categories || [];
      } catch (error) {
        // Fallback: extract unique categories from all beneficiaries
        console.log('Extracting unique categories from beneficiaries data');
        const categories = new Set();
        allBeneficiaries?.forEach((b: any) => {
          const category = typeof b.category === 'object' ? b.category?.name : b.category;
          if (category) categories.add(category);
        });
        return Array.from(categories).map(cat => ({ name: cat, id: cat }));
      }
    },
    enabled: !!allBeneficiaries?.length,
  });

  // Fetch unique parties for better filtering
  const { data: uniquePartiesData } = useQuery({
    queryKey: ['unique-political-parties'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/beneficiaries/unique-parties/');
        return response.data.parties || [];
      } catch (error) {
        // Fallback: extract unique parties from all beneficiaries
        console.log('Extracting unique parties from beneficiaries data');
        const parties = new Set();
        allBeneficiaries?.forEach((b: any) => {
          if (b.party) parties.add(b.party);
        });
        return Array.from(parties).map(party => ({ name: party, short_name: party }));
      }
    },
    enabled: !!allBeneficiaries?.length,
  });

  // Fetch vehicle makes from backend
  const { data: vehicleMakesData, isLoading: vehicleMakesLoading } = useQuery({
    queryKey: ['vehicle-makes'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/vehicle-makes/');
        console.log('Vehicle makes from API:', response.data);
        return response.data;
      } catch (error) {
        // Fallback: return hardcoded vehicle makes based on database
        console.log('Using fallback vehicle makes');
        return [
          { name: 'BMW', code: 'BMW' },
          { name: 'FORD', code: 'FORD' },
          { name: 'ISUZU', code: 'ISUZU' },
          { name: 'JAGUAR', code: 'JAGUAR' },
          { name: 'JEEP', code: 'JEEP' },
          { name: 'LAND ROVER', code: 'LAND_ROVER' },
          { name: 'MERCEDES BENZ', code: 'MERCEDES_BENZ' },
          { name: 'RANGE ROVER', code: 'RANGE_ROVER' },
          { name: 'TOYOTA', code: 'TOYOTA' },
          { name: 'NISSAN', code: 'NISSAN' },
          { name: 'SUBARU', code: 'SUBARU' },
          { name: 'VOLKSWAGEN', code: 'VOLKSWAGEN' },
          { name: 'HONDA', code: 'HONDA' },
          { name: 'MAZDA', code: 'MAZDA' },
          { name: 'MITSUBISHI', code: 'MITSUBISHI' },
          { name: 'PEUGEOT', code: 'PEUGEOT' },
          { name: 'VOLVO', code: 'VOLVO' },
          { name: 'MAHINDRA', code: 'MAHINDRA' },
          { name: 'JMC', code: 'JMC' },
        ];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Ensure constituencies, parties, users, and categories are always arrays
  const constituencies = constituenciesData || [];
  const politicalParties = politicalPartiesData || [];
  const systemUsers = systemUsersData || [];
  const beneficiaryCategories = Array.isArray(beneficiaryCategoriesData) ? beneficiaryCategoriesData : [];
  const vehicleMakes = vehicleMakesData || [];
  
  // Use unique data from database for better filtering options
  const uniqueCategories = uniqueCategoriesData || [];
  const uniqueParties = uniquePartiesData || [];

  // Debug logging for categories
  console.log('Categories Debug:', {
    beneficiaryCategories: beneficiaryCategories?.length,
    uniqueCategories: uniqueCategories?.length,
    beneficiaryCategoriesData: beneficiaryCategoriesData,
    uniqueCategoriesData: uniqueCategoriesData
  });

  // Debug logging for vehicle makes
  console.log('Vehicle Makes Debug:', {
    vehicleMakesCount: vehicleMakes?.length,
    vehicleMakesData: vehicleMakesData
  });

  // Prepare Select options (label/value) to allow optionFilterProp searches
  const constituencyOptions = constituencies.map((c: any) => ({
    label: c.province ? `${c.name} (${c.province})` : c.name,
    value: c.id || c.name,
  }));

  const partyOptions = uniqueParties.length > 0 
    ? uniqueParties.map((p: any) => ({
        label: p.short_name ? `${p.short_name} - ${p.name}` : (p.name || p),
        value: p.short_name || p.name || p,
      }))
    : politicalParties.map((p: any) => ({
        label: p.short_name ? `${p.short_name} - ${p.name}` : (p.name || p),
        value: p.short_name || p.name || p,
      }));

  const userOptions = systemUsers.map((u: any) => ({
    label: `${u.username} - ${u.first_name || ''} ${u.last_name || ''}`.trim(),
    value: u.id,
  }));

  // Merge beneficiaryCategories and uniqueCategories, dedupe by name, and build options
  const allCategoryCandidates = [
    ...(Array.isArray(beneficiaryCategories) ? beneficiaryCategories : []),
    ...(Array.isArray(uniqueCategories) ? uniqueCategories : []),
  ];

  const categoryMap = new Map<string, any>();
  allCategoryCandidates.forEach((c: any) => {
    const name = (typeof c === 'string' ? c : (c?.name || c))?.toString();
    if (!name) return;
    const key = name.trim().toUpperCase();
    if (!categoryMap.has(key)) {
      categoryMap.set(key, { name, raw: c });
    }
  });

  const categoryOptions = Array.from(categoryMap.values()).map((entry: any) => {
    const name = entry.name;
    const label = name
      .toString()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (s: string) => s.toUpperCase());
    return {
      label,
      value: name,
      searchable: name.toString().toLowerCase(),
    };
  }).sort((a: any, b: any) => a.label.localeCompare(b.label));

  // Vehicle makes options
  const vehicleMakeOptions = vehicleMakes.map((make: any) => ({
    label: make.name || make,
    value: make.name || make.code || make,
  }));

  // Debug logging after options are created
  console.log('Final Options Debug:', {
    categoryOptionsCount: categoryOptions?.length,
    vehicleMakeOptionsCount: vehicleMakeOptions?.length,
    beneficiaryCategoriesCount: beneficiaryCategories?.length,
    uniqueCategoriesCount: uniqueCategories?.length,
    categoryOptionsSample: categoryOptions?.slice(0, 15),
    allCategoryOptions: categoryOptions
  });

  // Extract beneficiaries from response
  const beneficiaries = beneficiariesResponse?.results || [];

  // Update total when server returns a count
  useEffect(() => {
    if (!beneficiariesResponse) return;
    const possibleTotal = (beneficiariesResponse as any)?.count || (beneficiariesResponse as any)?.total || (beneficiariesResponse as any)?.meta?.total || 0;
    setTotalBeneficiaries(possibleTotal);
  }, [beneficiariesResponse]);

  // Also update total from all beneficiaries response for more accurate count
  useEffect(() => {
    if (!allBeneficiariesResponse) return;
    const allTotal = allBeneficiariesResponse?.count || allBeneficiaries?.length || 0;
    if (allTotal > totalBeneficiaries) {
      setTotalBeneficiaries(allTotal);
    }
  }, [allBeneficiariesResponse, allBeneficiaries, totalBeneficiaries]);

  // Debug logging for statistics and categories
  useEffect(() => {
    console.log('Statistics Debug:', {
      allBeneficiariesCount: allBeneficiaries?.length,
      allBeneficiariesResponse: allBeneficiariesResponse?.count,
      sampleBeneficiaryCategories: allBeneficiaries?.slice(0, 5)?.map((b: any) => ({
        category: typeof b.category === 'object' ? b.category?.name : b.category,
        status: b.status,
        vehicles: b.vehicles?.length
      })),
      categoryOptionsCount: categoryOptions?.length,
      categoryOptions: categoryOptions?.slice(0, 10)
    });
  }, [allBeneficiaries, allBeneficiariesResponse, categoryOptions]);

  // Mutations for CRUD operations
  const activateBeneficiaryMutation = useMutation({
    mutationFn: (id: string) => BeneficiaryService.activateBeneficiary(id),
    onSuccess: () => {
      message.success('Beneficiary activated successfully');
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    },
    onError: () => {
      message.error('Failed to activate beneficiary');
    },
  });

  const deactivateBeneficiaryMutation = useMutation({
    mutationFn: (id: string) => BeneficiaryService.deactivateBeneficiary(id),
    onSuccess: () => {
      message.success('Beneficiary suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    },
    onError: () => {
      message.error('Failed to suspend beneficiary');
    },
  });

  const deleteBeneficiaryMutation = useMutation({
    mutationFn: (id: string) => BeneficiaryService.deleteBeneficiary(id),
    onSuccess: () => {
      message.success('Beneficiary deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    },
    onError: () => {
      message.error('Failed to delete beneficiary');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SPEAKER_NATIONAL_ASSEMBLY': return 'red';
      case 'DEPUTY_SPEAKER': return 'volcano';
      case 'MP': return 'blue';
      case 'WOMEN_QUOTA_MP': return 'magenta';
      case 'YOUTH_QUOTA_MP': return 'cyan';
      case 'MINISTER': return 'purple';
      case 'DEPUTY_MINISTER': return 'geekblue';
      case 'CHIEF_WHIP': return 'gold';
      case 'PORTFOLIO_COMMITTEE_MEMBER': return 'lime';
      case 'CLERK_OF_PARLIAMENT': return 'green';
      case 'SERGEANT_AT_ARMS': return 'orange';
      case 'LEGAL_ADVISOR': return 'yellow';
      case 'HANSARD_STAFF': return 'processing';
      case 'RESEARCH_OFFICER': return 'default';
      case 'ADMINISTRATIVE_STAFF': return 'orange';
      case 'SENATOR': return 'purple';
      case 'PRESIDENT_OF_SENATE': return 'red';
      case 'DEPUTY_PRESIDENT_OF_SENATE': return 'volcano';
      case 'TRADITIONAL_CHIEF_SENATOR': return 'gold';
      case 'DISABILITY_REPRESENTATIVE_SENATE': return 'cyan';
      case 'PARLIAMENTARY_LEGAL_COMMITTEE': return 'yellow';
      case 'PUBLIC_ACCOUNTS_COMMITTEE': return 'green';
      case 'COMMITTEE_CHAIRPERSON': return 'lime';
      case 'STAFF': return 'orange'; // Legacy support
      case 'OFFICIAL': return 'green'; // Legacy support
      default: return 'default';
    }
  };

  const handleEdit = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    // Populate the edit form with beneficiary data
    editForm.setFieldsValue({
      firstName: beneficiary.name?.split(' ')[0] || '',
      lastName: beneficiary.name?.split(' ').slice(1).join(' ') || '',
      employeeId: beneficiary.parliamentaryId,
      email: beneficiary.email,
      phoneNumber: beneficiary.phoneNumber,
      category: typeof beneficiary.category === 'object' ? beneficiary.category.name : beneficiary.category,
      position: beneficiary.title,
      party: beneficiary.party,
      constituency: typeof beneficiary.constituency === 'object' ? beneficiary.constituency.name : beneficiary.constituency,
      // Vehicle information
      vehicleMake: beneficiary.vehicles?.[0]?.make,
      vehicleModel: beneficiary.vehicles?.[0]?.model,
      vehicleYear: beneficiary.vehicles?.[0]?.year,
      vehicleRegistration: beneficiary.vehicles?.[0]?.registration,
      fuelType: beneficiary.vehicles?.[0]?.fuelType || 'DIESEL',
      // Administrative
      status: beneficiary.status,
      // Entitlements
      monthlyEntitlement: beneficiary.entitlements?.monthlyAllocation,
    });
    setIsEditModalOpen(true);
  };

  const columns = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      width: 300,
      render: (record: Beneficiary) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={48}
            src={record.profilePhoto}
            icon={<UserOutlined />}
            className="flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 truncate">
              {record.title} {record.name}
            </div>
            <div className="text-sm text-gray-500">{record.parliamentaryId}</div>
            <div className="flex items-center gap-2 mt-1">
              {(() => {
                const categoryName = (record as any)?.category?.name || (record as any)?.category || 'N/A';
                return (
                  <Tag color={getCategoryColor(categoryName)}>
                    {String(categoryName || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Tag>
                );
              })()}
              {record.constituency && (
                <Text type="secondary" className="text-xs truncate">
                  {typeof (record as any).constituency === 'string'
                    ? (record as any).constituency
                    : (record as any).constituency?.name || ''}
                </Text>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      render: (record: Beneficiary) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PhoneOutlined className="text-gray-400" />
            <Text className="text-sm">{record.phoneNumber || 'No Phone'}</Text>
          </div>
          <div className="flex items-center gap-2">
            <MailOutlined className="text-gray-400" />
            <Text className="text-sm truncate">{record.email || 'No Email'}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Parliamentary Position',
      dataIndex: 'category',
      key: 'category',
      width: 200,
      filters: categoryOptions.map((option: any) => ({
        text: option.label,
        value: option.value
      })),
      render: (category: any) => {
        // Handle both object format {name: "STAFF"} and string format "STAFF"
        const categoryName = category?.name || category || 'N/A';
        const displayName = (categoryName || '').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return (
          <Tag color={getCategoryColor(categoryName)}>{displayName}</Tag>
        );
      },
    },
    {
      title: 'Party',
      dataIndex: 'party',
      key: 'party',
      width: 100,
      render: (party: string) => (
        party ? <Tag color="purple">{party}</Tag> : <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Constituency',
      dataIndex: 'constituency',
      key: 'constituency',
      width: 150,
      render: (constituency: any) => (
        <div className="text-sm">
          <div className="font-medium">{constituency?.name || 'Not Assigned'}</div>
          {constituency?.province && (
            <div className="text-xs text-gray-500">{constituency.province}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Inactive', value: 'INACTIVE' },
        { text: 'Suspended', value: 'SUSPENDED' },
      ],
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Monthly Allocation',
      key: 'allocation',
      width: 120,
      sorter: true,
      render: (record: Beneficiary) => (
        <div className="text-center">
          <div className="font-semibold">{record.entitlements?.monthlyAllocation || 0}L</div>
          <div className="text-xs text-gray-500">
            Used: {record.fuelUsage?.currentMonth || 0}L
          </div>
          <Progress
            percent={Math.round(((record.fuelUsage?.currentMonth || 0) / (record.entitlements?.monthlyAllocation || 1)) * 100)}
            size="small"
            status={(record.fuelUsage?.currentMonth || 0) > (record.entitlements?.monthlyAllocation || 0) ? 'exception' : 'normal'}
          />
        </div>
      ),
    },
    {
      title: 'Vehicle Info',
      key: 'vehicles',
      width: 150,
      render: (record: Beneficiary) => (
        <div className="text-sm">
          {record.vehicles && Array.isArray(record.vehicles) && record.vehicles.length > 0 ? (
            <div>
              <div className="font-medium">{record.vehicles[0]?.make} {record.vehicles[0]?.model}</div>
              <div className="text-xs text-gray-500">{record.vehicles[0]?.registration || 'No Reg'}</div>
              <div className="text-xs text-gray-500">{record.vehicles[0]?.fuelType || 'N/A'}</div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <CarOutlined />
              <div className="text-xs">No Vehicle</div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      width: 120,
      sorter: true,
      render: (date: string) => (
        <div className="text-sm">
          {format(new Date(date), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: Beneficiary) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedBeneficiary(record);
                setIsDetailDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'ACTIVE' ? 'Suspend' : 'Activate'}>
            <Button
              type="text"
              size="small"
              icon={record.status === 'ACTIVE' ? <StopOutlined /> : <PlayCircleOutlined />}
              onClick={() => {
                if (record.status === 'ACTIVE') {
                  deactivateBeneficiaryMutation.mutate(record.id.toString());
                } else {
                  activateBeneficiaryMutation.mutate(record.id.toString());
                }
              }}
              danger={record.status === 'ACTIVE'}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Beneficiary',
                  content: `Are you sure you want to delete ${record.name}? This action cannot be undone.`,
                  okText: 'Delete',
                  okType: 'danger',
                  cancelText: 'Cancel',
                  onOk: () => deleteBeneficiaryMutation.mutate(record.id.toString()),
                });
              }}
              danger
            />
          </Tooltip>
          <Tooltip title="Vehicles">
            <Button
              type="text"
              size="small"
              icon={<CarOutlined />}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
    getCheckboxProps: (record: Beneficiary) => ({
      disabled: record.status === 'SUSPENDED',
    }),
  };

  return (
    <div className="space-y-6">
      <style>
        {`
          .beneficiaries-table .ant-table-thead > tr > th {
            font-size: 16px !important;
            font-weight: 600 !important;
            background: #fafafa !important;
          }
          .beneficiaries-table .ant-table-tbody > tr > td {
            font-size: 16px !important;
            padding: 16px !important;
          }
          .beneficiaries-table .ant-table-tbody > tr > td .ant-typography {
            font-size: 16px !important;
          }
          .beneficiaries-table .ant-table-tbody > tr > td .font-semibold {
            font-size: 16px !important;
            font-weight: 600 !important;
          }
          .beneficiaries-table .ant-table-tbody > tr > td .text-sm {
            font-size: 14px !important;
          }
          .beneficiaries-table .ant-tag {
            font-size: 14px !important;
            padding: 4px 8px !important;
          }
          .beneficiaries-table .ant-btn {
            font-size: 14px !important;
          }
        `}
      </style>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2}>Beneficiary Management</Title>
          <Text type="secondary">
            Manage parliament members, staff, and their fuel entitlements
          </Text>
        </div>
        <Space>
          <Button icon={<ImportOutlined />}>Import</Button>
          <Button icon={<ExportOutlined />}>Export</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Beneficiary
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Space>
              <span>Category:</span>
              <Select
                style={{ width: 200 }}
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="Select category"
                allowClear
              >
                {beneficiaryFilterCategories.map((cat: string) => (
                  <Option key={cat} value={cat}>{cat}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={16}>
            <Space>
              <span>Beneficiaries:</span>
              <Select
                mode="multiple"
                style={{ minWidth: 300 }}
                value={selectedBeneficiaryIds}
                onChange={setSelectedBeneficiaryIds}
                placeholder="Select beneficiaries"
                optionLabelProp="label"
                showSearch
              >
                {filteredBeneficiaries.map((b: any) => {
                  const displayName = b.user ? `${b.user.first_name || ''} ${b.user.last_name || ''}`.trim() : (b.constituency?.name || 'Unknown Name');
                  return (
                    <Option key={b.id} value={b.id} label={displayName}>
                      <span><input type="checkbox" checked={selectedBeneficiaryIds.includes(b.id)} readOnly style={{ marginRight: 8 }} />{displayName}</span>
                    </Option>
                  );
                })}
              </Select>
            </Space>
          </Col>
        </Row>
            <Statistic
              title="Total Beneficiaries"
              value={allBeneficiariesResponse?.count || allBeneficiaries?.length || 0}
              prefix={<TeamOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active MPs"
              value={allBeneficiaries?.filter((b: any) => {
                const category = typeof b.category === 'object' ? b.category?.name : b.category;
                // Include all MP-related categories from the complete list
                const mpCategories = [
                  'MEMBER OF PARLIAMENT',
                  'MEMBER_OF_PARLIAMENT', 
                  'MP',
                  'MINISTER',
                  'DEPUTY MINISTER',
                  'ASSISTANT MINISTER',
                  'CHIEF WHIP',
                  'DEPUTY CHIEF WHIP',
                  'SPEAKER',
                  'DEPUTY SPEAKER',
                  'COMMITTEE CHAIRPERSON',
                  'PARLIAMENTARY COMMITTEE MEMBER',
                  'OPPOSITION LEADER',
                  'DEPUTY OPPOSITION LEADER',
                  'BACKBENCHER',
                  'SENATOR',
                  'DEPUTY SENATOR'
                ];
                return mpCategories.includes(category) && b.status === 'ACTIVE';
              }).length || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Vehicles"
              value={allBeneficiaries?.reduce((sum: number, b: any) => {
                const vehicles = b.vehicles || [];
                // Handle both array and number formats
                const vehicleCount = Array.isArray(vehicles) ? vehicles.length : (typeof vehicles === 'number' ? vehicles : 0);
                return sum + vehicleCount;
              }, 0) || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CarOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Monthly Allocations"
              value={allBeneficiaries?.reduce((sum: number, b: any) => {
                // Handle multiple possible allocation field names and nested structures
                const allocation = b.entitlements?.monthlyAllocation || 
                                 b.entitlements?.monthly_allocation ||
                                 b.monthlyAllocation || 
                                 b.monthly_allocation ||
                                 b.allocation ||
                                 0;
                const numericAllocation = typeof allocation === 'number' ? allocation : parseFloat(allocation) || 0;
                return sum + numericAllocation;
              }, 0) || 0}
              suffix="L"
              valueStyle={{ color: '#722ed1' }}
              loading={statsLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <Search
            placeholder="Search by name, ID, or constituency"
            style={{ width: 300 }}
            onSearch={(value: string) => setFilters({ ...filters, search: value })}
          />
          <Select
            placeholder="Parliamentary Position"
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) => {
              if (!option) return false;
              // Match on label, value, and lowercase
              const label = (option.label || '').toString().toLowerCase();
              const value = (option.value || '').toString().toLowerCase();
              return label.includes(input.toLowerCase()) || value.includes(input.toLowerCase());
            }}
            onChange={(value) => setFilters({ ...filters, category: value })}
            options={categoryOptions}
          />
          <Select
            placeholder="Status"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={[
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
            ]}
          />
          <Select
            placeholder="Party"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, party: value })}
            options={[
              { label: 'ZANU-PF', value: 'ZANU-PF' },
              { label: 'MDC', value: 'MDC' },
              { label: 'CCC', value: 'CCC' },
              { label: 'Independent', value: 'Independent' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert
            message={
              <div className="flex items-center justify-between">
                <span>{selectedRowKeys.length} beneficiary(ies) selected</span>
                <Space>
                  <Button size="small">Activate</Button>
                  <Button size="small">Suspend</Button>
                  <Button size="small">Export</Button>
                </Space>
              </div>
            }
            type="info"
            closable
            onClose={() => setSelectedRowKeys([])}
          />
        </motion.div>
      )}

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={beneficiaries}
          rowKey="id"
          rowSelection={rowSelection}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: totalBeneficiaries || ((beneficiariesResponse as any)?.count || 0),
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} beneficiaries`,
            onChange: (nextPage: number, nextPageSize?: number) => {
              setPage(nextPage);
              if (nextPageSize && nextPageSize !== pageSize) setPageSize(nextPageSize);
            }
          }}
          scroll={{ x: 1400 }}
          className="beneficiaries-table"
          style={{
            '--table-font-size': '16px',
            '--table-header-font-size': '16px',
            '--table-header-font-weight': '600',
          } as React.CSSProperties & { [key: string]: any }}
          size="large"
        />
      </Card>

      {/* Beneficiary Detail Drawer */}
      <Drawer
        title="Beneficiary Details"
        open={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        width={800}
      >
        {selectedBeneficiary && (
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Overview" key="overview">
              <div className="space-y-6">
                {/* Profile Section */}
                <Card>
                  <div className="flex items-start gap-6">
                    <Avatar
                      size={120}
                      src={selectedBeneficiary.profilePhoto}
                      icon={<UserOutlined />}
                    />
                    <div className="flex-1">
                      <Title level={3} className="mb-2">
                        {selectedBeneficiary.title} {selectedBeneficiary.name}
                      </Title>
                      <div className="flex items-center gap-4 mb-4">
                        <Tag color={getCategoryColor(typeof selectedBeneficiary.category === 'object' ? selectedBeneficiary.category.name : selectedBeneficiary.category)}>
                          {typeof selectedBeneficiary.category === 'object' ? selectedBeneficiary.category.name : selectedBeneficiary.category}
                        </Tag>
                        <Tag color={getStatusColor(selectedBeneficiary.status)}>
                          {selectedBeneficiary.status}
                        </Tag>
                        {selectedBeneficiary.party && (
                          <Tag color="blue">{selectedBeneficiary.party}</Tag>
                        )}
                      </div>
                      <Descriptions column={2}>
                        <Descriptions.Item label="Parliamentary ID">
                          {selectedBeneficiary.parliamentaryId}
                        </Descriptions.Item>
                        <Descriptions.Item label="National ID">
                          {selectedBeneficiary.nationalId}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phone">
                          {selectedBeneficiary.phoneNumber}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                          {selectedBeneficiary.email}
                        </Descriptions.Item>
                        {selectedBeneficiary.constituency && (
                          <Descriptions.Item label="Constituency">
                            {typeof selectedBeneficiary.constituency === 'object' ? selectedBeneficiary.constituency.name : selectedBeneficiary.constituency}
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Date of Birth">
                          {format(new Date(selectedBeneficiary.dateOfBirth), 'MMMM dd, yyyy')}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  </div>
                </Card>

                {/* Fuel Usage Summary */}
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="Fuel Entitlements">
                      <Descriptions column={1}>
                        <Descriptions.Item label="Monthly Allocation">
                          ${selectedBeneficiary.entitlements.monthlyAllocation}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Per Transaction">
                          ${selectedBeneficiary.entitlements.maxPerTransaction}
                        </Descriptions.Item>
                        <Descriptions.Item label="Vehicle Count">
                          {selectedBeneficiary.entitlements.vehicleCount}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Usage Statistics">
                      <Descriptions column={1}>
                        <Descriptions.Item label="Current Month">
                          ${selectedBeneficiary.fuelUsage.currentMonth}
                        </Descriptions.Item>
                        <Descriptions.Item label="Last Month">
                          ${selectedBeneficiary.fuelUsage.lastMonth}
                        </Descriptions.Item>
                        <Descriptions.Item label="Year to Date">
                          ${selectedBeneficiary.fuelUsage.yearToDate}
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Used">
                          ${selectedBeneficiary.fuelUsage.totalUsed}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>

            <TabPane tab="Vehicles" key="vehicles">
              <div className="space-y-4">
                {selectedBeneficiary.vehicles.length > 0 ? (
                  selectedBeneficiary.vehicles.map((vehicle) => (
                    <Card key={vehicle.id} size="small">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar icon={<CarOutlined />} />
                          <div>
                            <div className="font-semibold">
                              {vehicle.make} {vehicle.model} ({vehicle.year})
                            </div>
                            <div className="text-sm text-gray-500">
                              Registration: {vehicle.registration}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Tag color={vehicle.fuelType === 'PETROL' ? 'blue' : 'orange'}>
                            {vehicle.fuelType}
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Empty description="No vehicles registered" />
                )}
              </div>
            </TabPane>

            <TabPane tab="Activity" key="activity">
              <Timeline>
                <Timeline.Item color="green">
                  <p>Account created</p>
                  <p className="text-gray-500 text-sm">
                    {format(new Date(selectedBeneficiary.createdAt), 'MMMM dd, yyyy HH:mm')}
                  </p>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <p>Last activity</p>
                  <p className="text-gray-500 text-sm">
                    {format(new Date(selectedBeneficiary.lastActivity), 'MMMM dd, yyyy HH:mm')}
                  </p>
                </Timeline.Item>
              </Timeline>
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* Create Beneficiary Modal - Harmonized with Backend */}
      <Modal
        title={<span style={{ fontSize: '20px', fontWeight: 'bold' }}>Add New Beneficiary</span>}
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        confirmLoading={isLoading}
        width={1600}
        destroyOnHidden
        style={{ fontSize: '16px' }}
        bodyStyle={{ fontSize: '16px' }}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              console.log('Form values:', values);
              
              // Transform form values to match backend serializer
              const beneficiaryData = {
                // Nested user object for creation
                user: {
                  first_name: values.firstName,
                  last_name: values.lastName,
                  email: values.email,
                  phone: values.phoneNumber,
                  full_address: values.address,
                  national_id: values.nationalId,
                  role: 'BENEFICIARY'
                },
                // Beneficiary profile fields  
                employee_id: values.employeeId || `EMP-${Date.now()}`,
                position: values.position,
                department: values.department || '',
                category: values.category, // This will be "MP", "SENATOR", "STAFF", or "OFFICIAL"
                constituency: values.constituency || null,
                party: values.party || null,
                monthly_entitlement_litres: parseFloat(values.monthlyEntitlement || '300'),
                // Vehicle info
                vehicle_make: values.vehicleMake || '',
                vehicle_model: values.vehicleModel || '',
                vehicle_year: parseInt(values.vehicleYear || '2020'),
                engine_size: values.engineSize || '',
                vehicle_registration: values.vehicleRegistration || '',
                fuel_type: values.fuelType || 'PETROL',
                // Additional fields
                office_location: values.officeLocation || '',
                base_allocation: parseFloat(values.baseAllocation || '200'),
                category_multiplier: parseFloat(values.categoryMultiplier || '1.0'),
                // Remove fields not in frontend form
                is_active_beneficiary: true
              };

              console.log('Sending data to backend:', beneficiaryData);
              
              const result = await BeneficiaryService.createBeneficiary(beneficiaryData);
              console.log('Backend response:', result);
              
              message.success('Beneficiary created successfully!');
              setIsCreateModalOpen(false);
              createForm.resetFields();
              refetch(); // Refresh the list
            } catch (error: any) {
              console.error('Failed to create beneficiary:', error);
              const errorMessage = error?.response?.data?.error || 
                                  error?.message || 
                                  'Failed to create beneficiary. Please check all fields and try again.';
              message.error(errorMessage);
            }
          }}
        >
          <div className="space-y-4" style={{ fontSize: '16px' }}>
            {/* System User Selection */}
            <Card size="small" title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>System User Selection</span>}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="systemUser"
                    label={<span style={{ fontSize: '16px', fontWeight: '600' }}>Link to Existing System User (Optional)</span>}
                    help={<span style={{ fontSize: '14px' }}>Select an existing system user with BENEFICIARY role to auto-populate information</span>}
                  >
                    <Select
                      placeholder="Select a system user or leave blank to create new"
                      allowClear
                      showSearch
                      loading={usersLoading}
                      optionFilterProp="label"
                      style={{ fontSize: '16px', minHeight: '40px' }}
                      options={userOptions}
                      onChange={(userId) => {
                        if (userId) {
                          const selectedUser = systemUsers.find((user: any) => user.id === userId);
                          if (selectedUser) {
                            // Auto-populate form fields
                            createForm.setFieldsValue({
                              firstName: selectedUser.first_name || '',
                              lastName: selectedUser.last_name || '',
                              email: selectedUser.email || '',
                              phoneNumber: selectedUser.phone_number || '',
                              employeeId: selectedUser.username || '',
                            });
                            message.success(`Auto-populated data from user: ${selectedUser.username}`);
                          }
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Personal Information */}
            <Card size="small" title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Personal Information</span>}>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item
                    name="firstName"
                    label={<span style={{ fontSize: '16px', fontWeight: '600' }}>First Name</span>}
                    rules={[{ required: true, message: 'Please enter first name' }]}
                  >
                    <Input placeholder="Enter first name" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="lastName"
                    label={<span style={{ fontSize: '16px', fontWeight: '600' }}>Last Name</span>}
                    rules={[{ required: true, message: 'Please enter last name' }]}
                  >
                    <Input placeholder="Enter last name" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="employeeId"
                    label={<span style={{ fontSize: '16px', fontWeight: '600' }}>Employee/Parliamentary ID</span>}
                    rules={[{ required: false, message: 'Please enter ID' }]}
                  >
                    <Input placeholder="Auto-generated if left empty" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="nationalId"
                    label={<span style={{ fontSize: '16px', fontWeight: '600' }}>National ID</span>}
                    rules={[{ required: true, message: 'Please enter national ID' }]}
                  >
                    <Input placeholder="Enter national ID" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="email"
                    label={<span style={{ fontSize: '16px', fontWeight: '600' }}>Email</span>}
                    rules={[
                      { required: true, message: 'Please enter email' },
                      { type: 'email', message: 'Please enter valid email' }
                    ]}
                  >
                    <Input placeholder="Enter email address" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="phoneNumber"
                    label={<span style={{ fontSize: '16px', fontWeight: '600' }}>Phone Number</span>}
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                  >
                    <Input placeholder="Enter phone number" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="address"
                    label={<span style={{ fontSize: '16px', fontWeight: '600' }}>Address</span>}
                    rules={[{ required: true, message: 'Please enter address' }]}
                  >
                    <Input.TextArea rows={2} placeholder="Enter full address" style={{ fontSize: '16px' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Role & Position */}
            <Card size="small" title="Role & Position" headStyle={{ fontSize: '16px', fontWeight: 600 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="category"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Parliamentary Position (Optional)</span>}
                    help="Leave blank if position will be assigned later"
                  >
                    <Select
                      placeholder="Select parliamentary position (optional)"
                      showSearch
                      allowClear
                      loading={categoriesLoading}
                      size="large"
                      style={{ fontSize: '16px', minHeight: '40px' }}
                      optionFilterProp="label"
                      options={categoryOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="position"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Position</span>}
                    rules={[{ required: true, message: 'Please enter position' }]}
                  >
                    <Input placeholder="Enter position/title" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="department"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Department</span>}
                  >
                    <Input placeholder="Enter department" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="constituency"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Constituency</span>}
                  >
                    <Select
                      placeholder="Select constituency"
                      showSearch
                      size="large"
                      style={{ fontSize: '16px', minHeight: '40px' }}
                      optionFilterProp="label"
                      loading={constituenciesLoading}
                      notFoundContent={constituenciesLoading ? 'Loading...' : 'No constituencies found'}
                      options={constituencyOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="party"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Political Party</span>}
                  >
                    <Select
                      placeholder="Select party"
                      allowClear
                      loading={partiesLoading}
                      showSearch
                      size="large"
                      style={{ fontSize: '16px', minHeight: '40px' }}
                      optionFilterProp="label"
                      options={partyOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="officeLocation"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Office Location</span>}
                  >
                    <Input placeholder="Enter office location" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Vehicle Information */}
            <Card size="small" title="Vehicle Information" headStyle={{ fontSize: '16px', fontWeight: 600 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item
                    name="vehicleMake"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Vehicle Make</span>}
                    rules={[{ required: true, message: 'Please select vehicle make' }]}
                  >
                    <Select 
                      placeholder="Select vehicle make" 
                      showSearch
                      allowClear
                      loading={vehicleMakesLoading}
                      size="large" 
                      style={{ fontSize: '16px', minHeight: '40px' }}
                      optionFilterProp="label"
                      filterOption={(input, option) => {
                        if (!option) return false;
                        const label = (option.label || '').toString().toLowerCase();
                        return label.includes(input.toLowerCase());
                      }}
                      options={vehicleMakeOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="vehicleModel"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Vehicle Model</span>}
                    rules={[{ required: true, message: 'Please enter vehicle model' }]}
                  >
                    <Input placeholder="e.g., Prado, C-Class" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="vehicleYear"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Year</span>}
                    rules={[{ required: true, message: 'Please enter year' }]}
                  >
                    <Input placeholder="e.g., 2020" type="number" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="fuelType"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Fuel Type</span>}
                    rules={[{ required: true, message: 'Please select fuel type' }]}
                  >
                    <Select placeholder="Select fuel type" size="large" style={{ fontSize: '16px', minHeight: '40px' }}>
                      <Select.Option value="PETROL">Petrol</Select.Option>
                      <Select.Option value="DIESEL">Diesel</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="engineSize"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Engine Size</span>}
                    rules={[{ required: true, message: 'Please enter engine size' }]}
                  >
                    <Input placeholder="e.g., 2.0L, 3.0L V6" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="vehicleRegistration"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Registration Number</span>}
                    rules={[{ required: true, message: 'Please enter registration' }]}
                  >
                    <Input placeholder="Enter registration number" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Fuel Allocation */}
            <Card size="small" title="Fuel Allocation" headStyle={{ fontSize: '16px', fontWeight: 600 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="monthlyEntitlement"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Monthly Entitlement (Litres)</span>}
                    rules={[{ required: true, message: 'Please enter monthly entitlement' }]}
                    initialValue={300}
                  >
                    <Input type="number" placeholder="Enter litres" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="baseAllocation"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Base Allocation (Litres)</span>}
                    initialValue={200}
                  >
                    <Input type="number" placeholder="Base allocation" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="categoryMultiplier"
                    label={<span style={{ fontSize: '16px', fontWeight: 600 }}>Category Multiplier</span>}
                    initialValue={1.0}
                  >
                    <Input type="number" step="0.1" placeholder="e.g., 1.5" size="large" style={{ fontSize: '16px', minHeight: '40px' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>
        </Form>
      </Modal>

      {/* Edit Beneficiary Modal */}
      <Modal
        title="Edit Beneficiary"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingBeneficiary(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        width={1000}
        confirmLoading={isLoading}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              if (!editingBeneficiary) return;
              
              const updateData = {
                user: {
                  first_name: values.firstName,
                  last_name: values.lastName,
                  email: values.email,
                  phone: values.phoneNumber,
                },
                position: values.position,
                department: values.department || '',
                category: values.category,
                constituency: values.constituency || null,
                party: values.party || null,
                monthly_entitlement_litres: parseFloat(values.monthlyEntitlement || '300'),
                office_location: values.officeLocation || '',
                employee_id: values.employeeId || null,
                // Vehicle information
                vehicle_make: values.vehicleMake || '',
                vehicle_model: values.vehicleModel || '',
                vehicle_year: values.vehicleYear || null,
                vehicle_registration: values.vehicleRegistration || '',
                engine_size: values.engineSize || '',
                fuel_type: values.fuelType || 'DIESEL',
                // Administrative
                status: values.status || 'ACTIVE',
                is_active_beneficiary: values.isActiveBeneficiary !== false,
                // Entitlements
                base_allocation: parseFloat(values.baseAllocation || '200'),
                // current_balance is computed on backend; do not send from client
              };

              // Update beneficiary via API
              console.log('Updating beneficiary:', updateData);
              await BeneficiaryService.updateBeneficiary(editingBeneficiary.id.toString(), updateData);
              
              setIsEditModalOpen(false);
              setEditingBeneficiary(null);
              editForm.resetFields();
              refetch();
              
              notification.success({
                message: 'Success',
                description: 'Beneficiary updated successfully',
              });
            } catch (error) {
              console.error('Failed to update beneficiary:', error);
              notification.error({
                message: 'Error',
                description: 'Failed to update beneficiary',
              });
            }
          }}
        >
          <div className="space-y-6">
            {/* Personal Information */}
            <Card size="small" title="Personal Information">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Please enter first name' }]}
                  >
                    <Input placeholder="Enter first name" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Please enter last name' }]}
                  >
                    <Input placeholder="Enter last name" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="employeeId"
                    label="Employee/Parliamentary ID"
                    rules={[{ required: false, message: 'Please enter ID' }]}
                  >
                    <Input placeholder="Auto-generated if left empty" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Please enter email' },
                      { type: 'email', message: 'Please enter valid email' }
                    ]}
                  >
                    <Input placeholder="Enter email address" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phoneNumber"
                    label="Phone Number"
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                  >
                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Role & Position */}
            <Card size="small" title="Role & Position">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="category"
                    label="Parliamentary Position (Optional)"
                    help="Leave blank if position will be assigned later"
                  >
                    <Select
                      placeholder="Select parliamentary position (optional)"
                      showSearch
                      allowClear
                      loading={categoriesLoading}
                      optionFilterProp="label"
                      options={categoryOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="position"
                    label="Position"
                    rules={[{ required: true, message: 'Please enter position' }]}
                  >
                    <Input placeholder="Enter position/title" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="department"
                    label="Department"
                  >
                    <Input placeholder="Enter department" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="constituency"
                    label="Constituency"
                  >
                    <Select
                      placeholder="Select constituency"
                      showSearch
                      optionFilterProp="label"
                      loading={constituenciesLoading}
                      notFoundContent={constituenciesLoading ? 'Loading...' : 'No constituencies found'}
                      options={constituencyOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="party"
                    label="Political Party"
                  >
                    <Select
                      placeholder="Select party"
                      allowClear
                      loading={partiesLoading}
                      showSearch
                      optionFilterProp="label"
                      options={partyOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="officeLocation"
                    label="Office Location"
                  >
                    <Input placeholder="Enter office location" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Vehicle Information */}
            <Card size="small" title="Vehicle Information">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="vehicleMake"
                    label="Vehicle Make"
                  >
                    <Select 
                      placeholder="Select vehicle make" 
                      showSearch
                      allowClear
                      loading={vehicleMakesLoading}
                      optionFilterProp="label"
                      filterOption={(input, option) => {
                        if (!option) return false;
                        const label = (option.label || '').toString().toLowerCase();
                        return label.includes(input.toLowerCase());
                      }}
                      options={vehicleMakeOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="vehicleModel"
                    label="Vehicle Model"
                  >
                    <Input placeholder="e.g., Prado, C-Class" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="vehicleYear"
                    label="Year"
                  >
                    <InputNumber 
                      placeholder="2020" 
                      min={1990} 
                      max={2030}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="vehicleRegistration"
                    label="Registration Number"
                  >
                    <Input placeholder="e.g., ABC-123" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="engineSize"
                    label="Engine Size"
                  >
                    <Input placeholder="e.g., 2.0L, 3.0L V6" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="fuelType"
                    label="Fuel Type"
                    initialValue="DIESEL"
                  >
                    <Select>
                      <Select.Option value="DIESEL">Diesel</Select.Option>
                      <Select.Option value="PETROL">Petrol</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Administrative Details */}
            <Card size="small" title="Administrative Details">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="employeeId"
                    label="Employee ID"
                  >
                    <Input placeholder="Enter employee ID" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="status"
                    label="Status"
                    initialValue="ACTIVE"
                  >
                    <Select>
                      <Select.Option value="ACTIVE">Active</Select.Option>
                      <Select.Option value="INACTIVE">Inactive</Select.Option>
                      <Select.Option value="SUSPENDED">Suspended</Select.Option>
                      <Select.Option value="PENDING_APPROVAL">Pending Approval</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="isActiveBeneficiary"
                    label="Active Beneficiary"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <input type="checkbox" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Entitlements */}
            <Card size="small" title="Fuel Entitlements">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="monthlyEntitlement"
                    label="Monthly Entitlement (Litres)"
                    rules={[{ required: true, message: 'Please enter monthly entitlement' }]}
                  >
                    <InputNumber
                      placeholder="Enter monthly litres"
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="baseAllocation"
                    label="Base Allocation"
                  >
                    <InputNumber
                      placeholder="Base amount"
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="currentBalance"
                    label="Current Balance (Litres)"
                  >
                    <InputNumber
                      placeholder="Current balance"
                      min={0}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BeneficiaryManagement;
