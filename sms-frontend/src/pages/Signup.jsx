import React, { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { signup } from "../services/authService";

const platforms = [
  {
    name: "Instagram",
    value: "instagram",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
        <defs>
          <linearGradient
            id="ig1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="#F58529"
            />
            <stop
              offset="50%"
              stopColor="#DD2A7B"
            />
            <stop
              offset="100%"
              stopColor="#8134AF"
            />
          </linearGradient>
        </defs>

        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          fill="url(#ig1)"
        />

        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="white"
          strokeWidth="2"
        />

        <circle
          cx="17"
          cy="7"
          r="1.2"
          fill="white"
        />
      </svg>
    ),
  },

  {
    name: "Facebook",
    value: "facebook",
    icon: (
      <svg
        className="w-5 h-5"
        fill="#1877F2"
        viewBox="0 0 24 24"
      >
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.099 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.791-4.668 4.532-4.668 1.312 0 2.686.234 2.686.234v2.953h-1.514c-1.49 0-1.955.925-1.955 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.099 24 12.073z" />
      </svg>
    ),
  },

  {
    name: "LinkedIn",
    value: "linkedin",
    icon: (
      <svg
        className="w-5 h-5"
        fill="#0A66C2"
        viewBox="0 0 24 24"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
      </svg>
    ),
  },

  {
    name: "Twitter/X",
    value: "twitter",
    icon: (
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153Z" />
      </svg>
    ),
  },

  {
    name: "YouTube",
    value: "youtube",
    icon: (
      <svg
        className="w-5 h-5"
        fill="#FF0000"
        viewBox="0 0 24 24"
      >
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },

  {
    name: "Pinterest",
    value: "pinterest",
    icon: (
      <svg
        className="w-5 h-5"
        fill="#BD081C"
        viewBox="0 0 24 24"
      >
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.173-2.914 1.026 0 1.521.769 1.521 1.691 0 1.031-.657 2.573-.994 3.992-.285 1.196.6 2.174 1.78 2.174 2.135 0 3.778-2.249 3.778-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.259 7.927-7.259 4.162 0 7.394 2.967 7.394 6.929 0 4.135-2.607 7.462-6.223 7.462-1.214 0-2.354-.63-2.745-1.373l-.749 2.853c-.27 1.031-1.002 2.324-1.492 3.119C9.516 23.811 10.74 24 12.017 24c6.621 0 12-5.378 12-12S18.638 0 12.017 0z" />
      </svg>
    ),
  },
];

export default function SignupPage() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    platforms: [],
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] =
    useState("");
  const [serverError, setServerError] =
    useState("");

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

    setServerError("");
  };

  // Handle Platform Selection
  const handlePlatformChange = (platform) => {

    let updatedPlatforms = [
      ...formData.platforms,
    ];

    if (
      updatedPlatforms.includes(platform)
    ) {

      updatedPlatforms =
        updatedPlatforms.filter(
          (item) => item !== platform
        );

    }

    else {

      updatedPlatforms.push(platform);

    }

    setFormData((prev) => ({
      ...prev,
      platforms: updatedPlatforms,
    }));

    setErrors((prev) => ({
      ...prev,
      platforms: "",
    }));
  };

  // Validate Form
  const validateForm = () => {

    let newErrors = {};

    // Full Name
    if (!formData.fullname.trim()) {

      newErrors.fullname =
        "Full name is required";

    }

    else if (
      formData.fullname.trim().length < 3
    ) {

      newErrors.fullname =
        "Full name must be at least 3 characters";

    }

    // Email
    if (!formData.email.trim()) {

      newErrors.email =
        "Email is required";

    }

    else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
        formData.email
      )
    ) {

      newErrors.email =
        "Enter a valid email";

    }

    // Password
    if (!formData.password) {

      newErrors.password =
        "Password is required";

    }

    else if (
      formData.password.length < 8
    ) {

      newErrors.password =
        "Password must be at least 8 characters";

    }

    else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(
        formData.password
      )
    ) {

      newErrors.password =
        "Must include uppercase, lowercase & number";

    }

    // Platforms
    if (
      formData.platforms.length === 0
    ) {

      newErrors.platforms =
        "Select at least one platform";

    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // Handle Submit
  const handleSubmit = async (e) => {

    e.preventDefault();

    setSuccessMessage("");
    setServerError("");

    if (!validateForm()) return;

    try {

      const response = await signup({
        fullname: formData.fullname,
        email: formData.email,
        password: formData.password,
        platforms: formData.platforms,
      });

      console.log(response);

      // Success Message
      setSuccessMessage(
        "Account created successfully!"
      );

      // Reset Form
      setFormData({
        fullname: "",
        email: "",
        password: "",
        platforms: [],
      });

      // Redirect
      setTimeout(() => {
        navigate("/sign-in");
      }, 2000);

    }

    catch (error) {

      console.log(error);

      if (
        error.payload?.error ===
        "Email already exists"
      ) {

        setServerError(
          "Email already taken. Please use another email."
        );

      }

      else {

        setServerError(
          error.payload?.error ||
          error.message ||
          "Signup failed"
        );

      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8fc] flex items-center justify-center px-4 py-6">

      <div className="w-full max-w-[440px] bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-8">

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#031635]">
            Sign Up
          </h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>

            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full h-11 rounded-xl border px-4 outline-none transition
              ${
                errors.fullname
                  ? "border-red-500"
                  : "border-gray-300 focus:border-[#031635]"
              }`}
            />

            {errors.fullname && (
              <p className="text-red-500 text-sm mt-1">
                {errors.fullname}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@agency.com"
              className={`w-full h-11 rounded-xl border px-4 outline-none transition
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full h-11 rounded-xl border px-4 outline-none transition
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

          {/* Platforms */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Select Platforms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {platforms.map((platform) => (

                <label
                  key={platform.value}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition
                  ${
                    formData.platforms.includes(
                      platform.value
                    )
                      ? "border-[#031635] bg-[#031635]/5"
                      : "border-gray-200 hover:border-[#031635]/30"
                  }`}
                >

                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.platforms.includes(
                      platform.value
                    )}
                    onChange={() =>
                      handlePlatformChange(
                        platform.value
                      )
                    }
                  />

                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center
                    ${
                      formData.platforms.includes(
                        platform.value
                      )
                        ? "bg-[#031635] border-[#031635]"
                        : "border-gray-300"
                    }`}
                  >

                    {formData.platforms.includes(
                      platform.value
                    ) && (
                      <span className="text-white text-xs">
                        ✓
                      </span>
                    )}

                  </div>

                  {platform.icon}

                  <span className="text-sm font-medium text-gray-700">
                    {platform.name}
                  </span>

                </label>
              ))}
            </div>

            {errors.platforms && (
              <p className="text-red-500 text-sm mt-2">
                {errors.platforms}
              </p>
            )}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
              {successMessage}
            </div>
          )}

          {/* Server Error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {serverError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-[#031635] text-white font-semibold text-base hover:opacity-95 active:scale-[0.99] transition"
          >
            Create Account
          </button>

        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}

            <Link
              to="/"
              className="text-[#031635] font-semibold hover:underline"
            >
              Sign In
            </Link>

          </p>
        </div>
      </div>
    </div>
  );
}
