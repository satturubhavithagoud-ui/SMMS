import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setLoginError("");
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 3) {
      newErrors.password = "Password must be at least 3 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const data = await login({ email: formData.email, password: formData.password });
      localStorage.setItem("user", JSON.stringify(data));
      if (data.role === "CLIENT") navigate("/dashboard");
      else if (data.role === "SMH") navigate("/smh-dashboard");
      else setLoginError("Unknown user role");
    } catch (error) {
      setLoginError(error.payload?.error || error.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8fc] flex items-center justify-center px-6 py-10 relative overflow-hidden">

      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(#e4e2e5_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Card */}
      <div className="w-full max-w-[600px] bg-white border border-gray-200 rounded-3xl shadow-md p-10 sm:p-14">

        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-[42px] font-bold text-[#031635]">Sign In</h1>
          <p className="text-gray-500 mt-2 text-base">Welcome back! Please enter your details.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-7">

          {/* Email */}
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-2">Email</label>
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              className={`w-full h-14 px-5 rounded-xl border bg-white outline-none transition text-base ${
                errors.email ? "border-red-500" : "border-gray-300 focus:border-[#031635]"
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-2">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={`w-full h-14 px-5 rounded-xl border bg-white outline-none transition text-base ${
                errors.password ? "border-red-500" : "border-gray-300 focus:border-[#031635]"
              }`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Login Error */}
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-5 py-4 rounded-xl">
              {loginError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full h-14 bg-[#031635] text-white rounded-xl font-semibold text-lg hover:opacity-95 active:scale-[0.98] transition"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center border-t border-gray-100 pt-7">
          <p className="text-base text-gray-500">
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-[#031635] font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
