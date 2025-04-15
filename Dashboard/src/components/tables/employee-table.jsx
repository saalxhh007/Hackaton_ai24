"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, Search, MoreHorizontal } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { EmployeeForm } from "./employee-form"

// Mock employees data
const initialEmployeesData = [
  {
    id: "EMP001",
    name: "John Smith",
    department: "IT",
    position: "Developer",
    email: "john.smith@company.com",
    phone: "(555) 123-4567",
    status: "active",
    photo: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "EMP002",
    name: "Sarah Johnson",
    department: "HR",
    position: "Manager",
    email: "sarah.johnson@company.com",
    phone: "(555) 234-5678",
    status: "active",
    photo: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "EMP003",
    name: "Michael Brown",
    department: "Finance",
    position: "Accountant",
    email: "michael.brown@company.com",
    phone: "(555) 345-6789",
    status: "inactive",
    photo: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "EMP004",
    name: "Emily Davis",
    department: "Marketing",
    position: "Coordinator",
    email: "emily.davis@company.com",
    phone: "(555) 456-7890",
    status: "active",
    photo: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "EMP005",
    name: "David Wilson",
    department: "Operations",
    position: "Supervisor",
    email: "david.wilson@company.com",
    phone: "(555) 567-8901",
    status: "active",
    photo: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "EMP006",
    name: "Jennifer Miller",
    department: "IT",
    position: "Designer",
    email: "jennifer.miller@company.com",
    phone: "(555) 678-9012",
    status: "inactive",
    photo: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "EMP007",
    name: "Robert Taylor",
    department: "Security",
    position: "Officer",
    email: "robert.taylor@company.com",
    phone: "(555) 789-0123",
    status: "active",
    photo: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "EMP008",
    name: "Lisa Anderson",
    department: "Admin",
    position: "Assistant",
    email: "lisa.anderson@company.com",
    phone: "(555) 890-1234",
    status: "active",
    photo: "/placeholder.svg?height=40&width=40",
  },
]

export function EmployeeTable() {
  const [employeesData, setEmployeesData] = useState(initialEmployeesData)
  const [employees, setEmployees] = useState(initialEmployeesData)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState("asc")
  const [formOpen, setFormOpen] = useState(false)

  // Handle search
  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase()
    setSearch(searchTerm)

    if (searchTerm === "") {
      setEmployees(employeesData)
    } else {
      const filtered = employeesData.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm) ||
          employee.id.toLowerCase().includes(searchTerm) ||
          employee.department.toLowerCase().includes(searchTerm),
      )
      setEmployees(filtered)
    }
  }

  // Handle sorting
  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(newDirection)

    const sortedEmployees = [...employees].sort((a, b) => {
      if (newDirection === "asc") {
        return a[field] > b[field] ? 1 : -1
      } else {
        return a[field] < b[field] ? 1 : -1
      }
    })

    setEmployees(sortedEmployees)
  }

  // Add new employee
  const handleAddEmployee = (newEmployee) => {
    const updatedEmployees = [...employeesData, newEmployee]
    console.log("updated: ", updatedEmployees)
    setEmployeesData(updatedEmployees)
    setEmployees(updatedEmployees)

    // Re-apply search filter if active
    if (search) {
      handleSearch({ target: { value: search } })
    }

    // Re-apply sorting
    handleSort(sortField)
  }

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  useEffect(() => {
    console.log("employees: ", employees)
  }, [employees])
  return (
    <div className="w-full space-y-4 p-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Employee Directory</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={handleSearch}
              className="w-[250px] pl-8"
            />
          </div>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            Add Employee
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("id")}>
                    ID {renderSortIndicator("id")}
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("name")}>
                    Employee {renderSortIndicator("name")}
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("department")}>
                    Department {renderSortIndicator("department")}
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("position")}>
                    Position {renderSortIndicator("position")}
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Contact</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{employee.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <img
                        src={employee.photo || "/placeholder.svg"}
                        alt={employee.name}
                        className="mr-2 h-8 w-8 rounded-full object-cover"
                      />
                      <span>{employee.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{employee.department}</td>
                  <td className="whitespace-nowrap px-4 py-3">{employee.position}</td>
                  <td className="px-4 py-3">
                    <div>
                      <div>{employee.email}</div>
                      <div className="text-sm text-muted-foreground">{employee.phone}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                      ${employee.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {employee.status === "active" ? "Active" : "Inactive"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit employee</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <strong>{employees.length}</strong> of <strong>{employeesData.length}</strong> employees
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>

      {/* Employee Form Modal */}
      <EmployeeForm open={formOpen} onOpenChange={setFormOpen} onAddEmployee={handleAddEmployee} />
    </div>
  )
}
