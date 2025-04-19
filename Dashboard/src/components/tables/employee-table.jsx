"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Search, MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import EmployeeForm from "./employee-form";

const url = import.meta.env.VITE_BACKEND_URL;

export function EmployeeTable() {
  const [initialEmployeesData, setInitialEmployeesData] = useState([]);

  const fetchInitialEmployeesData = async (currentPage = 1) => {
    try {
      const response = await axios.get(
        `${url}/api3/employees/?page=${currentPage}&limit=${limit}`
      );
      if (response.status === 200) {
        setInitialEmployeesData(response.data.results);
        setTotal(response.data.total);
        setPage(response.data.page);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  };

  const [page, setPage] = useState(1);
  const [limit] = useState(6); // or 10, up to you
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchInitialEmployeesData(page);
  }, [page]);

  const [employeesData, setEmployeesData] = useState(initialEmployeesData);
  const [employees, setEmployees] = useState(initialEmployeesData);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    setEmployeesData(initialEmployeesData);
    setEmployees(initialEmployeesData);
  }, [initialEmployeesData]);

  // Handle search
  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearch(searchTerm);

    if (searchTerm === "") {
      setEmployees(employeesData);
    } else {
      const filtered = employeesData.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm) ||
          employee.id.toLowerCase().includes(searchTerm) ||
          employee.department.toLowerCase().includes(searchTerm)
      );
      setEmployees(filtered);
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    const newDirection =
      field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);

    const sortedEmployees = [...employees].sort((a, b) => {
      if (newDirection === "asc") {
        return a[field] > b[field] ? 1 : -1;
      } else {
        return a[field] < b[field] ? 1 : -1;
      }
    });

    setEmployees(sortedEmployees);
  };

  // Add new employee
  const handleAddEmployee = (newEmployee) => {
    const updatedEmployees = [...employeesData, newEmployee];
    console.log("updated: ", updatedEmployees);
    setEmployeesData(updatedEmployees);
    setEmployees(updatedEmployees);

    // Re-apply search filter if active
    if (search) {
      handleSearch({ target: { value: search } });
    }

    // Re-apply sorting
    handleSort(sortField);
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

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
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="whitespace-nowrap">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  ID {renderSortIndicator("id")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Employee {renderSortIndicator("name")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("department")}
                >
                  Department {renderSortIndicator("department")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("position")}
                >
                  Position {renderSortIndicator("position")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">Contact</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length > 0 &&
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="whitespace-nowrap font-medium">
                    {employee.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <img
                        src={`${url}/${employee.photo}`}
                        alt={employee.name}
                        className="mr-2 h-8 w-8 rounded-full object-cover"
                      />
                      <span>{employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {employee.department}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {employee.position}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{employee.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                    ${
                      employee.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                    >
                      {employee.status === "active" ? "Active" : "Inactive"}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
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
                        <DropdownMenuItem className="text-red-600">
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing from <strong>{employees.length * page - (employees.length - 1)}</strong> To <strong>{employees.length * page}</strong>
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * limit >= total}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Employee Form Modal */}
      {formOpen && (
        <EmployeeForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onAddEmployee={handleAddEmployee}
        />
      )}
    </div>
  );
}
