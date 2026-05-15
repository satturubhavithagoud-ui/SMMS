import React, { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";
import { login } from "../services/authService";

export default function LoginPage() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");

  // Handle Input Change
  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setLoginError("");
  };

  // Validate Form
  const validateForm = () => {

    let newErrors = {};

    // Email Validation
    if (!formData.email.trim()) {

      newErrors.email = "Email is required";

    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
        formData.email
      )
    ) {

      newErrors.email =
        "Enter a valid email address";

    }

    // Password Validation
    if (!formData.password) {

      newErrors.password =
        "Password is required";

    } else if (
      formData.password.length < 3
    ) {

      newErrors.password =
        "Password must be at least 3 characters";

    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Handle Submit
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validateForm()) return;

    try {

      const data = await login({
        email: formData.email,
        password: formData.password,
      });

      console.log(data);

      // Store user data
      localStorage.setItem(
        "user",
        JSON.stringify(data)
      );

      // Redirect based on role
      if (data.role === "CLIENT") {

        navigate("/dashboard");

      }

      else if (data.role === "SMH") {

        navigate("/smh-dashboard");

      }

      else {

        setLoginError(
          "Unknown user role"
        );

      }

    }

    catch (error) {

      console.log(error);

      setLoginError(
        error.payload?.error ||
        error.message ||
        "Login failed"
      );

    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8fc] flex items-center justify-center px-4 py-6 relative overflow-hidden">

      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(#e4e2e5_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Card */}
      <div className="w-full max-w-[440px] bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#031635]">
            Sign In
          </h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              className={`w-full h-12 px-4 rounded-xl border bg-white outline-none transition
              ${
                errors.email
                  ? "border-red-500"
                  : "border-gray-300 focus:border-[#031635]"
              }`}
            />

            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={`w-full h-12 px-4 rounded-xl border bg-white outline-none transition
              ${
                errors.password
                  ? "border-red-500"
                  : "border-gray-300 focus:border-[#031635]"
              }`}
            />

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Invalid Credentials */}
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {loginError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-12 bg-[#031635] text-white rounded-xl font-semibold text-base hover:opacity-95 active:scale-[0.98] transition"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500">
            Don’t have an account?{" "}

            <Link
              to="/sign-up"
              className="text-[#031635] font-semibold hover:underline"
            >
              Sign Up
            </Link>

          </p>
        </div>
      </div>

      {/* Decorative Image */}
      <div className="hidden lg:block fixed -bottom-10 -right-10 opacity-10">
        <img
          src="https://lh3.googleusercontent.com/aida/ADBb0ujLIo2tXXOSmsvcPByJg4RmDdJCtaUS19xFpDcM1D4WOF_6fK-e8zAAdFwr5OQa3PBM9aItSY9ZihrjEaTVHYf6H1H9Fw22UqTZvTIrpo5BWGiwuoPg_y0G7bxp5CXAEwCy9k9_0exfDPZUOtFuBVcyB4awS2IaSxQYNwMJUVuP58AGaCGvewf0GhQ2ejmDOAZQi8JXHln78s3kRuLLi14nKKbRPC6qvyf_IIlE131rW_KrgQjdSi1bDxOGYTKHG12YjfTreIisozA"
          alt="Decorative"
          className="w-64 h-auto grayscale rotate-12"
        />
      </div>
    </div>
  );
}
