import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/viewmodels/auth.context'
import { ProtectedRoute } from '@/views/components/ProtectedRoute'
import { RoleGuard } from '@/views/components/RoleGuard'
import { AppLayout } from '@/views/layouts/AppLayout'
import { LoginPage } from '@/views/pages/LoginPage'
import { NotFoundPage } from '@/views/pages/NotFoundPage'
import { ManagerDashboardPage } from '@/views/pages/ManagerDashboardPage'
import { EmployeeDashboardPage } from '@/views/pages/EmployeeDashboardPage'
import { EmployeeListPage } from '@/views/pages/EmployeeListPage'
import { EmployeeFormPage } from '@/views/pages/EmployeeFormPage'
import { MachineListPage } from '@/views/pages/MachineListPage'
import { MachineFormPage } from '@/views/pages/MachineFormPage'
import { ContractListPage } from '@/views/pages/ContractListPage'
import { ContractFormPage } from '@/views/pages/ContractFormPage'
import { JobListPage } from '@/views/pages/JobListPage'
import { JobFormPage } from '@/views/pages/JobFormPage'
import { EmployeeJobListPage } from '@/views/pages/EmployeeJobListPage'
import { EmployeeJobDetailPage } from '@/views/pages/EmployeeJobDetailPage'
import { JobFinalizationPage } from '@/views/pages/JobFinalizationPage'
import { ManagerJobDetailPage } from '@/views/pages/ManagerJobDetailPage'
import { FinancialPage } from '@/views/pages/FinancialPage'
import { SchedulePage } from '@/views/pages/SchedulePage'
import { ScheduleEventFormPage } from '@/views/pages/ScheduleEventFormPage'
import { ScheduleEventDetailPage } from '@/views/pages/ScheduleEventDetailPage'
import { ChatPage } from '@/views/pages/ChatPage'
import { ToolListPage } from '@/views/pages/tools/ToolListPage'
import { ToolFormPage } from '@/views/pages/tools/ToolFormPage'
import { ChangePasswordPage } from '@/views/pages/ChangePasswordPage'

const UnauthorizedPage = () => <div className="p-8"><h1>Sem permissão</h1></div>

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Manager / Admin routes */}
              <Route element={<RoleGuard allowedRoles={['admin', 'manager']} />}>
                <Route path="/" element={<ManagerDashboardPage />} />
                <Route path="/jobs" element={<JobListPage />} />
                <Route path="/jobs/new" element={<JobFormPage />} />
                <Route path="/jobs/:id/edit" element={<JobFormPage />} />
                <Route path="/jobs/:id" element={<ManagerJobDetailPage />} />
                <Route path="/machines" element={<MachineListPage />} />
                <Route path="/machines/new" element={<MachineFormPage />} />
                <Route path="/machines/:id/edit" element={<MachineFormPage />} />
                <Route path="/contracts" element={<ContractListPage />} />
                <Route path="/contracts/new" element={<ContractFormPage />} />
                <Route path="/contracts/:id/edit" element={<ContractFormPage />} />
                <Route path="/employees" element={<EmployeeListPage />} />
                <Route path="/employees/new" element={<EmployeeFormPage />} />
                <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
                <Route path="/financial" element={<FinancialPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/schedule/new" element={<ScheduleEventFormPage />} />
                <Route path="/schedule/:id" element={<ScheduleEventDetailPage />} />
                <Route path="/tools" element={<ToolListPage />} />
                <Route path="/tools/new" element={<ToolFormPage />} />
                <Route path="/tools/:id/edit" element={<ToolFormPage />} />
              </Route>

              {/* All authenticated users */}
              <Route path="/change-password" element={<ChangePasswordPage />} />

              {/* Employee routes */}
              <Route element={<RoleGuard allowedRoles={['employee']} />}>
                <Route path="/dashboard" element={<EmployeeDashboardPage />} />
                <Route path="/my-jobs" element={<EmployeeJobListPage />} />
                <Route path="/my-jobs/:id" element={<EmployeeJobDetailPage />} />
                <Route path="/jobs/:id/finalize" element={<JobFinalizationPage />} />
                <Route path="/chat" element={<ChatPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
