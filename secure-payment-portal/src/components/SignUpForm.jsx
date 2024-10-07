import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // eslint-disable-next-line no-unused-vars
  const validateInput = (name, value) => {
    const pattern = PATTERNS[name];
    return pattern.test(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Always update the form state so the user can type freely
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset the error if the user is still typing
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("https://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // Check if the response is okay
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let data;

        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error("Response Text:", text);
          throw new Error("Unexpected response format");
        }

        // Check for specific error messages
        if (data.message === "User already registered. Redirecting to login.") {
          // Redirect to login page
          navigate("/login");
          return; // Ensure we exit the function after navigation
        }

        // If it's a different error, throw it
        throw new Error(data.message || "Registration failed");
      }

      // If the registration is successful
      const data = await response.json();
      console.log(data); // Log the success message for debugging
      navigate("/login"); // Redirect to login page
    } catch (err) {
      setError(err.message); // Show error message to user
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Sign Up</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Password must contain at least 8 characters, including uppercase,
            lowercase, number, and special character.
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUpForm;
