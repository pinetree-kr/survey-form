import { UserTable } from './components'

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">사용자 관리</h1>
      <UserTable />
    </div>
  )
}