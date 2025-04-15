import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, X, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

const url = import.meta.env.VITE_BACKEND_URL;

function EmployeeForm({ open, onOpenChange, onAddEmployee }) {
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    position: "",
    email: "",
    phone: "",
    status: "active",
  });
  const [errors, setErrors] = useState({});
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const webcamRef = useRef(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Capture photo from webcam
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const base64ToFile = (base64, filename = "photo.png") => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  // Reset captured photo
  const resetPhoto = () => {
    setCapturedImage(null);
  };

  // Toggle webcam
  const toggleCamera = () => {
    setShowCamera((prev) => !prev);
    if (capturedImage) {
      setCapturedImage(null);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.position) newErrors.position = "Position is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Generate a unique ID (in a real app, this would come from the backend)
      const newId = `EMP${Math.floor(1000 + Math.random() * 9000)}`;

      const formDataToSend = new FormData();

      if (capturedImage) {
        const file = base64ToFile(capturedImage, "photo.png");
        formDataToSend.append("photo", file); // now it's a real file
      }
      formDataToSend.append("name", formData.name);
      formDataToSend.append("department", formData.department);
      formDataToSend.append("position", formData.position);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("status", formData.status);

      const res = await axios.post(
        `${url}/api3/employees/create/`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.status === 200) {
        console.log(res);

        // Create new employee object
        const newEmployee = {
          ...formData,
          id: newId,
          photo: capturedImage || "/placeholder.svg?height=40&width=40",
        };

        // Add employee
        onAddEmployee(newEmployee);

        // Reset form
        setFormData({
          name: "",
          department: "",
          position: "",
          email: "",
          phone: "",
          status: "active",
        });
        setCapturedImage(null);
        setShowCamera(false);
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Photo capture section */}
            <div className="flex flex-col items-center gap-2">
              {showCamera && !capturedImage ? (
                <div className="relative w-full max-w-[320px] overflow-hidden rounded-md border">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }}
                    className="h-[240px] w-full object-cover"
                  />
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                    <Button type="button" onClick={capturePhoto} size="sm">
                      Take Photo
                    </Button>
                    <Button
                      type="button"
                      onClick={toggleCamera}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : capturedImage ? (
                <div className="relative w-full max-w-[320px]">
                  <img
                    src={capturedImage || "/placeholder.svg"}
                    alt="Captured"
                    className="h-[240px] w-full rounded-md border object-cover"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <Button
                      type="button"
                      onClick={resetPhoto}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={toggleCamera}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <Button
                    type="button"
                    onClick={toggleCamera}
                    variant="outline"
                    size="sm"
                  >
                    Open Camera
                  </Button>
                </div>
              )}
            </div>

            {/* Form fields */}
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) =>
                    handleSelectChange("department", value)
                  }
                >
                  <SelectTrigger
                    id="department"
                    className={errors.department ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-xs text-red-500">{errors.department}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={errors.position ? "border-red-500" : ""}
                />
                {errors.position && (
                  <p className="text-xs text-red-500">{errors.position}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Employee</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeForm;