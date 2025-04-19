"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Search,
  Users,
} from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Mock activity data
const generateActivityData = () => {
  // Create entries and exits for each employee
  const activities = [];
  const employees = [
    {
      id: "EMP001",
      name: "John Smith",
      photo: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "EMP002",
      name: "Sarah Johnson",
      photo: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "EMP003",
      name: "Michael Brown",
      photo: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "EMP004",
      name: "Emily Davis",
      photo: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "EMP005",
      name: "David Wilson",
      photo: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "EMP006",
      name: "Jennifer Miller",
      photo: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "EMP007",
      name: "Robert Taylor",
      photo: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "EMP008",
      name: "Lisa Anderson",
      photo: "/placeholder.svg?height=40&width=40",
    },
  ];

  employees.forEach((employee) => {
    // Morning entry
    const morningEntry = {
      id: `entry-${employee.id}-morning`,
      employeeId: employee.id,
      name: employee.name,
      type: "entry",
      timestamp: new Date(
        new Date().setHours(
          8 + Math.floor(Math.random() * 2),
          Math.floor(Math.random() * 60),
          0
        )
      ),
      photo: employee.photo,
    };

    activities.push(morningEntry);

    // Some employees have lunch breaks
    if (Math.random() > 0.3) {
      activities.push({
        id: `exit-${employee.id}-lunch`,
        employeeId: employee.id,
        name: employee.name,
        type: "exit",
        timestamp: new Date(
          new Date().setHours(12, Math.floor(Math.random() * 30), 0)
        ),
        photo: employee.photo,
      });

      activities.push({
        id: `entry-${employee.id}-after-lunch`,
        employeeId: employee.id,
        name: employee.name,
        type: "entry",
        timestamp: new Date(
          new Date().setHours(13, Math.floor(Math.random() * 30), 0)
        ),
        photo: employee.photo,
      });
    }

    // Evening exit - some employees are still present
    if (Math.random() > 0.3) {
      activities.push({
        id: `exit-${employee.id}-evening`,
        employeeId: employee.id,
        name: employee.name,
        type: "exit",
        timestamp: new Date(
          new Date().setHours(
            16 + Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 60),
            0
          )
        ),
        photo: employee.photo,
      });
    }
  });

  // Sort by timestamp (newest first)
  return activities.sort((a, b) => b.timestamp - a.timestamp);
};

// Determine current status of employees
const determineEmployeeStatus = (activities) => {
  const status = {};

  // Group activities by employee
  const employeeActivities = {};
  activities.forEach((activity) => {
    if (!employeeActivities[activity.employeeId]) {
      employeeActivities[activity.employeeId] = [];
    }
    employeeActivities[activity.employeeId].push(activity);
  });

  // Sort each employee's activities by time (most recent first)
  Object.keys(employeeActivities).forEach((employeeId) => {
    employeeActivities[employeeId].sort((a, b) => b.timestamp - a.timestamp);
    const lastActivity = employeeActivities[employeeId][0];
    status[employeeId] = {
      present: lastActivity.type === "entry",
      lastActivity: lastActivity,
    };
  });

  return status;
};

export function ActivityTable() {
  const [activities, setActivities] = useState([]);
  const [employeeStatus, setEmployeeStatus] = useState({});
  const [search, setSearch] = useState("");
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortField, setSortField] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Initialize data
  useEffect(() => {
    const activityData = generateActivityData();
    setActivities(activityData);
    setFilteredActivities(activityData);

    const status = determineEmployeeStatus(activityData);
    setEmployeeStatus(status);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearch(searchTerm);
    applyFilters(searchTerm, filter);
  };

  // Handle filter change
  const handleFilterChange = (value) => {
    setFilter(value);
    applyFilters(search, value);
  };

  // Apply both filters and search
  const applyFilters = (searchTerm, filterType) => {
    let filtered = activities;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(searchTerm) ||
          activity.employeeId.toLowerCase().includes(searchTerm)
      );
    }

    // Apply filter
    if (filterType === "entry") {
      filtered = filtered.filter((activity) => activity.type === "entry");
    } else if (filterType === "exit") {
      filtered = filtered.filter((activity) => activity.type === "exit");
    }

    setFilteredActivities(filtered);
  };

  // Handle sorting
  const handleSort = (field) => {
    const newDirection =
      field === sortField && sortDirection === "desc" ? "asc" : "desc";
    setSortField(field);
    setSortDirection(newDirection);

    const sortedActivities = [...filteredActivities].sort((a, b) => {
      if (field === "timestamp") {
        return newDirection === "desc"
          ? b[field] - a[field]
          : a[field] - b[field];
      } else {
        return newDirection === "desc"
          ? b[field] > a[field]
            ? 1
            : -1
          : a[field] > b[field]
          ? 1
          : -1;
      }
    });

    setFilteredActivities(sortedActivities);
  };

  // Calculate attendance summary
  const calculateSummary = () => {
    const totalEmployees = Object.keys(employeeStatus).length;
    const presentCount = Object.values(employeeStatus).filter(
      (status) => status.present
    ).length;

    return {
      total: totalEmployees,
      present: presentCount,
      absent: totalEmployees - presentCount,
    };
  };

  const summary = calculateSummary();

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full space-y-4 p-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activity Log</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search log entries..."
              value={search}
              onChange={handleSearch}
              className="w-[250px] pl-8"
            />
          </div>
          <Select defaultValue={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="entry">Entries Only</SelectItem>
              <SelectItem value="exit">Exits Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm font-medium">Total Employees</div>
          </div>
          <div className="mt-1 text-2xl font-bold">{summary.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-green-500" />
            <div className="text-sm font-medium">Present</div>
          </div>
          <div className="mt-1 text-2xl font-bold">{summary.present}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-red-500" />
            <div className="text-sm font-medium">Absent</div>
          </div>
          <div className="mt-1 text-2xl font-bold">{summary.absent}</div>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("timestamp")}
                  >
                    Time {renderSortIndicator("timestamp")}
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("employeeId")}
                  >
                    ID {renderSortIndicator("employeeId")}
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Employee {renderSortIndicator("name")}
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  Activity
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  Current Status
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedActivities.map((activity) => (
                <tr key={activity.id} className="border-t">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                      {formatTime(activity.timestamp)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {activity.employeeId}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <img
                        src={activity.photo || "/placeholder.svg"}
                        alt={activity.name}
                        className="mr-2 h-8 w-8 rounded-full object-cover"
                      />
                      <span>{activity.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        activity.type === "entry"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {activity.type === "entry" ? "Entry" : "Exit"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {employeeStatus[activity.employeeId]?.present ? (
                      <div className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                        Present
                      </div>
                    ) : (
                      <div className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        <div className="mr-1 h-2 w-2 rounded-full bg-red-500"></div>
                        Absent
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="flex justify-end items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
