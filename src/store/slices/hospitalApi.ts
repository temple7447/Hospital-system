import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getToken } from '@/lib/api';
import {
  mapBackendUser, mapBackendPatient, toBackendPatient,
  mapBackendAppointment, toBackendAppointment,
  mapBackendPrescription, toBackendPrescription,
  mapBackendVital, toBackendVital,
  mapBackendStaff, toBackendStaff,
  mapBackendDepartment, toBackendDepartment,
  mapBackendRoom, toBackendRoom,
  mapBackendLabOrder, toBackendLabOrder,
  mapBackendInvoice, toBackendInvoice,
  mapBackendInventoryItem, toBackendInventoryItem,
  mapBackendNursingTask, toBackendNursingTask,
  mapBackendConsultationNote, toBackendConsultationNote,
  mapBackendQueueEntry, toBackendQueueEntry,
  mapBackendNotification,
} from '@/lib/mappers';
import type {
  Patient, Appointment, Prescription, VitalRecord, Staff,
  Department, Room, LabOrder, Invoice, InventoryItem,
  NursingTask, ConsultationNote, QueueEntry, Notification,
  AdminStats, DoctorStats, NurseStats, PharmacistStats,
  LabTechStatsType, RadiologistStats, PatientStats, ReceptionistStats,
} from '@/types';
import type { User } from '@/types/auth';
import type {
  BackendUser, BackendPatient, BackendAppointment, BackendPrescription,
  BackendVital, BackendStaff, BackendDepartment, BackendRoom, BackendLabOrder,
  BackendInvoice, BackendInventoryItem, BackendNursingTask, BackendConsultationNote,
  BackendQueueEntry, BackendNotification,
} from '@/lib/mappers';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

export const hospitalApi = createApi({
  reducerPath: 'hospitalApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE,
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    'Patient', 'Appointment', 'Prescription', 'Vital',
    'Staff', 'Department', 'Room', 'LabOrder', 'Invoice',
    'Inventory', 'NursingTask', 'ConsultationNote', 'Queue',
    'Notification', 'Stats',
  ],
  endpoints: (builder) => ({

    // ─── Auth ───────────────────────────────────────────────────────────────────
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (raw: BackendUser) => mapBackendUser(raw),
      providesTags: ['Stats'],
    }),

    // ─── Stats ──────────────────────────────────────────────────────────────────
    getAdminStats: builder.query<AdminStats, void>({
      query: () => '/stats/admin',
      transformResponse: (d: {
        total_patients: number; total_staff: number; today_appointments: number;
        available_beds: number; total_beds: number; pending_invoices: number;
        monthly_revenue: number; low_stock_items: number;
      }): AdminStats => ({
        totalPatients: d.total_patients, totalStaff: d.total_staff,
        todayAppointments: d.today_appointments, availableBeds: d.available_beds,
        totalBeds: d.total_beds, pendingInvoices: d.pending_invoices,
        monthlyRevenue: d.monthly_revenue, lowStockItems: d.low_stock_items,
      }),
      providesTags: ['Stats'],
    }),
    getDoctorStats: builder.query<DoctorStats, void>({
      query: () => '/stats/doctor',
      transformResponse: (d: { today_appointments: number; total_patients: number; pending_lab_orders: number; completed_today: number }): DoctorStats => ({
        todayAppointments: d.today_appointments, totalPatients: d.total_patients,
        pendingLabOrders: d.pending_lab_orders, completedToday: d.completed_today,
      }),
      providesTags: ['Stats'],
    }),
    getNurseStats: builder.query<NurseStats, void>({
      query: () => '/stats/nurse',
      transformResponse: (d: { tasks_today: number; tasks_completed: number; vitals_recorded_today: number }): NurseStats => ({
        myPatients: 0, tasksToday: d.tasks_today, tasksCompleted: d.tasks_completed, vitalsRecordedToday: d.vitals_recorded_today,
      }),
      providesTags: ['Stats'],
    }),
    getPharmacistStats: builder.query<PharmacistStats, void>({
      query: () => '/stats/pharmacist',
      transformResponse: (d: { pending_prescriptions: number; dispensed_today: number; low_stock_medicines: number; total_active: number }): PharmacistStats => ({
        pendingPrescriptions: d.pending_prescriptions, dispensedToday: d.dispensed_today,
        lowStockMedicines: d.low_stock_medicines, totalActive: d.total_active,
      }),
      providesTags: ['Stats'],
    }),
    getLabTechStats: builder.query<LabTechStatsType, void>({
      query: () => '/stats/lab-tech',
      transformResponse: (d: { pending_orders: number; in_progress: number; completed_today: number; urgent_orders: number }): LabTechStatsType => ({
        pendingOrders: d.pending_orders, inProgress: d.in_progress, completedToday: d.completed_today, urgentOrders: d.urgent_orders,
      }),
      providesTags: ['Stats'],
    }),
    getRadiologistStats: builder.query<RadiologistStats, void>({
      query: () => '/stats/radiologist',
      transformResponse: (d: { pending_imaging: number; in_progress: number; completed_today: number; urgent_imaging: number }): RadiologistStats => ({
        pendingImaging: d.pending_imaging, inProgress: d.in_progress, completedToday: d.completed_today, urgentImaging: d.urgent_imaging,
      }),
      providesTags: ['Stats'],
    }),
    getPatientStats: builder.query<PatientStats, void>({
      query: () => '/stats/patient',
      transformResponse: (d: { upcoming_appointments: number; active_prescriptions: number; pending_bills: number; total_visits: number }): PatientStats => ({
        upcomingAppointments: d.upcoming_appointments, activePrescriptions: d.active_prescriptions,
        pendingBills: d.pending_bills, totalVisits: d.total_visits,
      }),
      providesTags: ['Stats'],
    }),
    getReceptionistStats: builder.query<ReceptionistStats, void>({
      query: () => '/stats/receptionist',
      transformResponse: (d: { waiting_queue: number; today_registrations: number; today_appointments: number; pending_payments: number }): ReceptionistStats => ({
        waitingQueue: d.waiting_queue, todayRegistrations: d.today_registrations,
        todayAppointments: d.today_appointments, pendingPayments: d.pending_payments,
      }),
      providesTags: ['Stats'],
    }),

    // ─── Patients ───────────────────────────────────────────────────────────────
    getPatients: builder.query<Patient[], { search?: string; page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/patients', params: params ?? {} }),
      transformResponse: (raw: { patients: BackendPatient[] }) => (raw.patients ?? []).map(mapBackendPatient),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Patient' as const, id })), 'Patient']
        : ['Patient'],
    }),
    getPatient: builder.query<Patient, string>({
      query: (id) => `/patients/${id}`,
      transformResponse: (raw: BackendPatient) => mapBackendPatient(raw),
      providesTags: (result, error, id) => [{ type: 'Patient', id }],
    }),
    createPatient: builder.mutation<{ id: string }, Partial<Patient>>({
      query: (data) => ({ url: '/patients', method: 'POST', body: toBackendPatient(data) }),
      invalidatesTags: ['Patient', 'Stats'],
    }),
    updatePatient: builder.mutation<void, { id: string } & Partial<Patient>>({
      query: ({ id, ...data }) => ({ url: `/patients/${id}`, method: 'PUT', body: toBackendPatient(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Patient', id }, 'Stats'],
    }),
    deletePatient: builder.mutation<void, string>({
      query: (id) => ({ url: `/patients/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Patient', 'Stats'],
    }),

    // ─── Appointments ────────────────────────────────────────────────────────────
    getAppointments: builder.query<Appointment[], { date?: string; doctor_id?: string; patient_id?: string; status?: string; page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/appointments', params: params ?? {} }),
      transformResponse: (raw: { appointments: BackendAppointment[] }) => (raw.appointments ?? []).map(mapBackendAppointment),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Appointment' as const, id })), 'Appointment']
        : ['Appointment'],
    }),
    getAppointment: builder.query<Appointment, string>({
      query: (id) => `/appointments/${id}`,
      transformResponse: (raw: BackendAppointment) => mapBackendAppointment(raw),
      providesTags: (result, error, id) => [{ type: 'Appointment', id }],
    }),
    createAppointment: builder.mutation<{ id: string }, Partial<Appointment>>({
      query: (data) => ({ url: '/appointments', method: 'POST', body: toBackendAppointment(data) }),
      invalidatesTags: ['Appointment', 'Stats'],
    }),
    updateAppointment: builder.mutation<void, { id: string } & Partial<Appointment>>({
      query: ({ id, ...data }) => ({ url: `/appointments/${id}`, method: 'PUT', body: toBackendAppointment(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Appointment', id }, 'Appointment', 'Stats'],
    }),
    deleteAppointment: builder.mutation<void, string>({
      query: (id) => ({ url: `/appointments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Appointment', 'Stats'],
    }),

    // ─── Prescriptions ───────────────────────────────────────────────────────────
    getPrescriptions: builder.query<Prescription[], { patient_id?: string; status?: string; page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/prescriptions', params: params ?? {} }),
      transformResponse: (raw: { prescriptions: BackendPrescription[] }) => (raw.prescriptions ?? []).map(mapBackendPrescription),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Prescription' as const, id })), 'Prescription']
        : ['Prescription'],
    }),
    getPrescription: builder.query<Prescription, string>({
      query: (id) => `/prescriptions/${id}`,
      transformResponse: (raw: BackendPrescription) => mapBackendPrescription(raw),
      providesTags: (result, error, id) => [{ type: 'Prescription', id }],
    }),
    createPrescription: builder.mutation<{ id: string }, Partial<Prescription>>({
      query: (data) => ({ url: '/prescriptions', method: 'POST', body: toBackendPrescription(data) }),
      invalidatesTags: ['Prescription', 'Stats'],
    }),
    updatePrescription: builder.mutation<void, { id: string } & Partial<Prescription>>({
      query: ({ id, ...data }) => ({ url: `/prescriptions/${id}`, method: 'PUT', body: toBackendPrescription(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Prescription', id }, 'Prescription', 'Stats'],
    }),
    deletePrescription: builder.mutation<void, string>({
      query: (id) => ({ url: `/prescriptions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Prescription'],
    }),

    // ─── Vitals ──────────────────────────────────────────────────────────────────
    getVitals: builder.query<VitalRecord[], { patient_id?: string; page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/vitals', params: params ?? {} }),
      transformResponse: (raw: { vitals: BackendVital[] }) => (raw.vitals ?? []).map(mapBackendVital),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Vital' as const, id })), 'Vital']
        : ['Vital'],
    }),
    createVital: builder.mutation<{ id: string }, Partial<VitalRecord>>({
      query: (data) => ({ url: '/vitals', method: 'POST', body: toBackendVital(data) }),
      invalidatesTags: ['Vital', 'Stats'],
    }),
    updateVital: builder.mutation<void, { id: string } & Partial<VitalRecord>>({
      query: ({ id, ...data }) => ({ url: `/vitals/${id}`, method: 'PUT', body: toBackendVital(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Vital', id }, 'Vital'],
    }),

    // ─── Staff ───────────────────────────────────────────────────────────────────
    getStaff: builder.query<Staff[], { role?: string; department_id?: string; status?: string; search?: string; page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/staff', params: params ?? {} }),
      transformResponse: (raw: { staff: BackendStaff[] }) => (raw.staff ?? []).map(mapBackendStaff),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Staff' as const, id })), 'Staff']
        : ['Staff'],
    }),
    getStaffMember: builder.query<Staff, string>({
      query: (id) => `/staff/${id}`,
      transformResponse: (raw: BackendStaff) => mapBackendStaff(raw),
      providesTags: (result, error, id) => [{ type: 'Staff', id }],
    }),
    createStaff: builder.mutation<{ id: string }, Partial<Staff>>({
      query: (data) => ({ url: '/staff', method: 'POST', body: toBackendStaff(data) }),
      invalidatesTags: ['Staff', 'Stats'],
    }),
    updateStaff: builder.mutation<void, { id: string } & Partial<Staff>>({
      query: ({ id, ...data }) => ({ url: `/staff/${id}`, method: 'PUT', body: toBackendStaff(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Staff', id }, 'Staff'],
    }),
    deleteStaff: builder.mutation<void, string>({
      query: (id) => ({ url: `/staff/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Staff', 'Stats'],
    }),

    // ─── Departments ─────────────────────────────────────────────────────────────
    getDepartments: builder.query<Department[], void>({
      query: () => '/departments',
      transformResponse: (raw: { departments: BackendDepartment[] }) => (raw.departments ?? []).map(mapBackendDepartment),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Department' as const, id })), 'Department']
        : ['Department'],
    }),
    createDepartment: builder.mutation<{ id: string }, Partial<Department>>({
      query: (data) => ({ url: '/departments', method: 'POST', body: toBackendDepartment(data) }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation<void, { id: string } & Partial<Department>>({
      query: ({ id, ...data }) => ({ url: `/departments/${id}`, method: 'PUT', body: toBackendDepartment(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Department', id }, 'Department'],
    }),
    deleteDepartment: builder.mutation<void, string>({
      query: (id) => ({ url: `/departments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Department'],
    }),

    // ─── Rooms ───────────────────────────────────────────────────────────────────
    getRooms: builder.query<Room[], { department_id?: string; type?: string; status?: string } | void>({
      query: (params) => ({ url: '/rooms', params: params ?? {} }),
      transformResponse: (raw: { rooms: BackendRoom[] }) => (raw.rooms ?? []).map(mapBackendRoom),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Room' as const, id })), 'Room']
        : ['Room'],
    }),
    createRoom: builder.mutation<{ id: string }, Partial<Room>>({
      query: (data) => ({ url: '/rooms', method: 'POST', body: toBackendRoom(data) }),
      invalidatesTags: ['Room'],
    }),
    updateRoom: builder.mutation<void, { id: string } & Partial<Room>>({
      query: ({ id, ...data }) => ({ url: `/rooms/${id}`, method: 'PUT', body: toBackendRoom(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Room', id }, 'Room'],
    }),
    deleteRoom: builder.mutation<void, string>({
      query: (id) => ({ url: `/rooms/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Room'],
    }),

    // ─── Lab Orders ──────────────────────────────────────────────────────────────
    getLabOrders: builder.query<LabOrder[], { patient_id?: string; doctor_id?: string; status?: string; category?: string; page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/lab-orders', params: params ?? {} }),
      transformResponse: (raw: { lab_orders: BackendLabOrder[] }) => (raw.lab_orders ?? []).map(mapBackendLabOrder),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'LabOrder' as const, id })), 'LabOrder']
        : ['LabOrder'],
    }),
    getLabOrder: builder.query<LabOrder, string>({
      query: (id) => `/lab-orders/${id}`,
      transformResponse: (raw: BackendLabOrder) => mapBackendLabOrder(raw),
      providesTags: (result, error, id) => [{ type: 'LabOrder', id }],
    }),
    createLabOrder: builder.mutation<{ id: string }, Partial<LabOrder>>({
      query: (data) => ({ url: '/lab-orders', method: 'POST', body: toBackendLabOrder(data) }),
      invalidatesTags: ['LabOrder', 'Stats'],
    }),
    updateLabOrder: builder.mutation<void, { id: string } & Partial<LabOrder>>({
      query: ({ id, ...data }) => ({ url: `/lab-orders/${id}`, method: 'PUT', body: toBackendLabOrder(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'LabOrder', id }, 'LabOrder', 'Stats'],
    }),

    // ─── Invoices ────────────────────────────────────────────────────────────────
    getInvoices: builder.query<Invoice[], { patient_id?: string; status?: string; page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/invoices', params: params ?? {} }),
      transformResponse: (raw: { invoices: BackendInvoice[] }) => (raw.invoices ?? []).map(mapBackendInvoice),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Invoice' as const, id })), 'Invoice']
        : ['Invoice'],
    }),
    createInvoice: builder.mutation<{ id: string }, Partial<Invoice>>({
      query: (data) => ({ url: '/invoices', method: 'POST', body: toBackendInvoice(data) }),
      invalidatesTags: ['Invoice', 'Stats'],
    }),
    updateInvoice: builder.mutation<void, { id: string } & Partial<Invoice>>({
      query: ({ id, ...data }) => ({ url: `/invoices/${id}`, method: 'PUT', body: toBackendInvoice(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Invoice', id }, 'Invoice', 'Stats'],
    }),

    // ─── Inventory ───────────────────────────────────────────────────────────────
    getInventory: builder.query<InventoryItem[], { category?: string; search?: string } | void>({
      query: (params) => ({ url: '/inventory', params: params ?? {} }),
      transformResponse: (raw: { inventory: BackendInventoryItem[] }) => (raw.inventory ?? []).map(mapBackendInventoryItem),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'Inventory' as const, id })), 'Inventory']
        : ['Inventory'],
    }),
    createInventoryItem: builder.mutation<{ id: string }, Partial<InventoryItem>>({
      query: (data) => ({ url: '/inventory', method: 'POST', body: toBackendInventoryItem(data) }),
      invalidatesTags: ['Inventory', 'Stats'],
    }),
    updateInventoryItem: builder.mutation<void, { id: string } & Partial<InventoryItem>>({
      query: ({ id, ...data }) => ({ url: `/inventory/${id}`, method: 'PUT', body: toBackendInventoryItem(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Inventory', id }, 'Inventory', 'Stats'],
    }),
    deleteInventoryItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/inventory/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Inventory'],
    }),

    // ─── Nursing Tasks ───────────────────────────────────────────────────────────
    getNursingTasks: builder.query<NursingTask[], { nurse_id?: string; patient_id?: string; status?: string } | void>({
      query: (params) => ({ url: '/nursing-tasks', params: params ?? {} }),
      transformResponse: (raw: { tasks: BackendNursingTask[] }) => (raw.tasks ?? []).map(mapBackendNursingTask),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'NursingTask' as const, id })), 'NursingTask']
        : ['NursingTask'],
    }),
    createNursingTask: builder.mutation<{ id: string }, Partial<NursingTask>>({
      query: (data) => ({ url: '/nursing-tasks', method: 'POST', body: toBackendNursingTask(data) }),
      invalidatesTags: ['NursingTask', 'Stats'],
    }),
    updateNursingTask: builder.mutation<void, { id: string } & Partial<NursingTask>>({
      query: ({ id, ...data }) => ({ url: `/nursing-tasks/${id}`, method: 'PUT', body: toBackendNursingTask(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'NursingTask', id }, 'NursingTask', 'Stats'],
    }),

    // ─── Consultation Notes ──────────────────────────────────────────────────────
    getConsultationNotes: builder.query<ConsultationNote[], { patient_id?: string; doctor_id?: string; appointment_id?: string } | void>({
      query: (params) => ({ url: '/consultation-notes', params: params ?? {} }),
      transformResponse: (raw: { notes: BackendConsultationNote[] }) => (raw.notes ?? []).map(mapBackendConsultationNote),
      providesTags: (result) => result
        ? [...result.map(({ id }) => ({ type: 'ConsultationNote' as const, id })), 'ConsultationNote']
        : ['ConsultationNote'],
    }),
    createConsultationNote: builder.mutation<{ id: string }, Partial<ConsultationNote>>({
      query: (data) => ({ url: '/consultation-notes', method: 'POST', body: toBackendConsultationNote(data) }),
      invalidatesTags: ['ConsultationNote'],
    }),
    updateConsultationNote: builder.mutation<void, { id: string } & Partial<ConsultationNote>>({
      query: ({ id, ...data }) => ({ url: `/consultation-notes/${id}`, method: 'PUT', body: toBackendConsultationNote(data) }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ConsultationNote', id }, 'ConsultationNote'],
    }),

    // ─── Queue ───────────────────────────────────────────────────────────────────
    getQueue: builder.query<QueueEntry[], { date?: string; status?: string; doctor_id?: string } | void>({
      query: (params) => ({ url: '/queue', params: params ?? {} }),
      transformResponse: (raw: { queue: BackendQueueEntry[] }) => (raw.queue ?? []).map(mapBackendQueueEntry),
      providesTags: ['Queue'],
    }),
    createQueueEntry: builder.mutation<{ id: string }, Partial<QueueEntry>>({
      query: (data) => ({ url: '/queue', method: 'POST', body: toBackendQueueEntry(data) }),
      invalidatesTags: ['Queue', 'Stats'],
    }),
    updateQueueEntry: builder.mutation<void, { id: string } & Partial<QueueEntry>>({
      query: ({ id, ...data }) => ({ url: `/queue/${id}`, method: 'PUT', body: toBackendQueueEntry(data) }),
      invalidatesTags: ['Queue', 'Stats'],
    }),

    // ─── Notifications ───────────────────────────────────────────────────────────
    getNotifications: builder.query<Notification[], { user_id?: string; read?: boolean } | void>({
      query: (params) => ({ url: '/notifications', params: params ?? {} }),
      transformResponse: (raw: { notifications: BackendNotification[] }) => (raw.notifications ?? []).map(mapBackendNotification),
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    createNotification: builder.mutation<{ id: string }, Partial<Notification>>({
      query: (data) => ({ url: '/notifications', method: 'POST', body: data }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetAdminStatsQuery, useGetDoctorStatsQuery, useGetNurseStatsQuery,
  useGetPharmacistStatsQuery, useGetLabTechStatsQuery, useGetRadiologistStatsQuery,
  useGetPatientStatsQuery, useGetReceptionistStatsQuery,
  useGetPatientsQuery, useGetPatientQuery, useCreatePatientMutation, useUpdatePatientMutation, useDeletePatientMutation,
  useGetAppointmentsQuery, useGetAppointmentQuery, useCreateAppointmentMutation, useUpdateAppointmentMutation, useDeleteAppointmentMutation,
  useGetPrescriptionsQuery, useGetPrescriptionQuery, useCreatePrescriptionMutation, useUpdatePrescriptionMutation, useDeletePrescriptionMutation,
  useGetVitalsQuery, useCreateVitalMutation, useUpdateVitalMutation,
  useGetStaffQuery, useGetStaffMemberQuery, useCreateStaffMutation, useUpdateStaffMutation, useDeleteStaffMutation,
  useGetDepartmentsQuery, useCreateDepartmentMutation, useUpdateDepartmentMutation, useDeleteDepartmentMutation,
  useGetRoomsQuery, useCreateRoomMutation, useUpdateRoomMutation, useDeleteRoomMutation,
  useGetLabOrdersQuery, useGetLabOrderQuery, useCreateLabOrderMutation, useUpdateLabOrderMutation,
  useGetInvoicesQuery, useCreateInvoiceMutation, useUpdateInvoiceMutation,
  useGetInventoryQuery, useCreateInventoryItemMutation, useUpdateInventoryItemMutation, useDeleteInventoryItemMutation,
  useGetNursingTasksQuery, useCreateNursingTaskMutation, useUpdateNursingTaskMutation,
  useGetConsultationNotesQuery, useCreateConsultationNoteMutation, useUpdateConsultationNoteMutation,
  useGetQueueQuery, useCreateQueueEntryMutation, useUpdateQueueEntryMutation,
  useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation, useCreateNotificationMutation,
} = hospitalApi;
