import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../config/axios";
import playNotificationSound from "../../utils/playNotification";

function BlogPostForm({ onBlogCreated, initialData, mode, setIsDrawerOpen }) {
  // Form fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
    const [loading,setLoading]=useState(false)
  
  // Validation errors
  const [errors, setErrors] = useState({
    title: "",
    author: "",
    date: "",
    excerpt: "",
    content: "",
    image: ""
  });

  const inputRef = useRef(null);

  // Validation functions
  const validateTitle = (value) => {
    if (!value.trim()) {
      return "Title is required";
    }
    if (value.trim().length < 5) {
      return "Title must be at least 5 characters long";
    }
    if (value.trim().length > 100) {
      return "Title cannot exceed 100 characters";
    }
    return "";
  };

  const validateAuthor = (value) => {
    if (!value.trim()) {
      return "Author name is required";
    }
    if (value.trim().length < 2) {
      return "Author name must be at least 2 characters long";
    }
    if (value.trim().length > 50) {
      return "Author name cannot exceed 50 characters";
    }
    return "";
  };

  const validateDate = (value) => {
    if (!value) {
      return "Date is required";
    }
    const selectedDate = new Date(value);
    const currentDate = new Date();
    if (selectedDate > currentDate) {
      return "Date cannot be in the future";
    }
    return "";
  };

  const validateExcerpt = (value) => {
    if (!value.trim()) {
      return "Excerpt is required";
    }
    if (value.trim().length < 20) {
      return "Excerpt must be at least 20 characters long";
    }
    if (value.trim().length > 300) {
      return "Excerpt cannot exceed 300 characters";
    }
    return "";
  };

  const validateContent = (value) => {
    if (!value.trim()) {
      return "Content is required";
    }
    if (value.trim().length < 50) {
      return "Content must be at least 50 characters long";
    }
    return "";
  };

  const validateImage = (file) => {
    if (mode === "add" && !file) {
      return "Image is required";
    }
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return "Invalid image type. Allowed types: JPEG, PNG, GIF, WebP";
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return "Image size cannot exceed 5MB";
      }
    }
    return "";
  };

  // Validation handler
  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        return validateTitle(value);
      case 'author':
        return validateAuthor(value);
      case 'date':
        return validateDate(value);
      case 'excerpt':
        return validateExcerpt(value);
      case 'content':
        return validateContent(value);
      case 'image':
        return validateImage(value);
      default:
        return "";
    }
  };

  // Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    let errorMessage = "";

    if (name === 'image') {
      const file = files[0];
      errorMessage = validateField('image', file);
      if (file) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      // For text inputs
      switch (name) {
        case 'title':
          setTitle(value);
          break;
        case 'author':
          setAuthor(value);
          break;
        case 'date':
          setDate(value);
          break;
        case 'excerpt':
          setExcerpt(value);
          break;
        case 'content':
          setContent(value);
          break;
      }
      errorMessage = validateField(name, value);
    }

    // Update errors state
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMessage
    }));
  };

  // Form submission validation
  const validateForm = () => {
    const titleError = validateTitle(title);
    const authorError = validateAuthor(author);
    const dateError = validateDate(date);
    const excerptError = validateExcerpt(excerpt);
    const contentError = validateContent(content);
    const imageError = validateImage(imageFile);

    setErrors({
      title: titleError,
      author: authorError,
      date: dateError,
      excerpt: excerptError,
      content: contentError,
      image: imageError
    });

    // Return true if no errors
    return !(titleError || authorError || dateError || excerptError || contentError || imageError);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate entire form before submission
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("date", date);
    formData.append("excerpt", excerpt);
    formData.append("content", content);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      let response;
      if (mode === "add") {
        setLoading(!loading)
        let response = await axiosInstance.post("/blog/create-blog", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success(response.data.message ||"Blog post created successfully!");
        setLoading(false)

      } else if (mode === "edit" && initialData) {
        const response = await axiosInstance.put(
          `/blog/update-blog/${initialData.id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        playNotificationSound()
        toast.success(response.data.message ||"Blog post updated successfully!");
      }

      if (onBlogCreated) {
        onBlogCreated();
      }

      // Reset form
      setTitle("");
      setAuthor("");
      setDate("");
      setExcerpt("");
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error handling blog post:", error);
      toast.error("Failed to save blog post. Please try again.");
    }    
    finally {
      setLoading(false); // Hide loader after submission
    }
  };


  // Existing useEffect for populating form in edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setTitle(initialData.title || "");
      setAuthor(initialData.author || "");
      setDate(initialData.date || "");
      setExcerpt(initialData.excerpt || "");
      setContent(initialData.content || "");
      setImagePreview(initialData.image || null);
    } else if (mode === "add") {
      // Reset all fields
      setTitle("");
      setAuthor("");
      setDate("");
      setExcerpt("");
      setContent("");
      setImageFile(null);
      setImagePreview(null);
       // Completely clear all error messages
       setErrors({
        title: "",
        author: "",
        date: "",
        excerpt: "",
        content: "",
        image: ""
      });
    }
  }, [mode, initialData]);

  const onCancel= ()=>{
    setIsDrawerOpen(false);
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Title Input */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Title</span>
        </label>
        <input
          type="text"
          name="title"
          placeholder="Post title"
          className={`input input-bordered ${errors.title ? 'input-error' : 'border-accent'}`}
          value={title}
          onChange={handleInputChange}
        />
        {errors.title && <p className="text-error text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Author Input */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Author</span>
        </label>
        <input
          type="text"
          name="author"
          placeholder="Author name"
          className={`input input-bordered ${errors.author ? 'input-error' : 'border-accent'}`}
          value={author}
          onChange={handleInputChange}
        />
        {errors.author && <p className="text-error text-sm mt-1">{errors.author}</p>}
      </div>

      {/* Date Input */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Date</span>
        </label>
        <input
          type="date"
          name="date"
          className={`input input-bordered ${errors.date ? 'input-error' : 'border-accent'}`}
          value={date}
          onChange={handleInputChange}
        />
        {errors.date && <p className="text-error text-sm mt-1">{errors.date}</p>}
      </div>

      {/* Excerpt Input */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Excerpt</span>
        </label>
        <textarea
          name="excerpt"
          className={`textarea textarea-bordered ${errors.excerpt ? 'textarea-error' : ''}`}
          placeholder="Short summary of the blog post..."
          value={excerpt}
          onChange={handleInputChange}
        ></textarea>
        {errors.excerpt && <p className="text-error text-sm mt-1">{errors.excerpt}</p>}
      </div>

      {/* Image Upload */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Image</span>
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer ${errors.image ? 'border-error' : 'border-neutral'}`}
          onClick={() => inputRef.current?.click()}
        >
          {!imagePreview ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-primary mb-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M4 3a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v3.586l-1.293-1.293a1 1 0 00-1.414 0L10 12l-2.293-2.293a1 1 0 00-1.414 0L4 12V5zm0 10v-1.586l2.293-2.293a1 1 0 011.414 0L10 13l3.293-3.293a1 1 0 011.414 0L16 12.414V15H4z" />
              </svg>
              <p className="text-neutral-content">Drag and drop or click to upload</p>
            </>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto rounded-lg shadow-lg"
              />
              <button
                type="button"
                className="absolute top-2 right-2 btn btn-xs btn-error"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  if (inputRef.current) {
                    inputRef.current.value = "";
                  }
                }}
              >
                Remove
              </button>
            </div>
          )}
          <input
            type="file"
            name="image"
            accept="image/*"
            className="hidden"
            ref={inputRef}
            onChange={handleInputChange}
          />
        </div>
        {errors.image && <p className="text-error text-sm mt-1">{errors.image}</p>}
      </div>

      {/* Content Input */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Content</span>
        </label>
        <textarea
          name="content"
          className={`textarea textarea-bordered ${errors.content ? 'textarea-error' : ''}`}
          placeholder="Write your post content..."
          value={content}
          onChange={handleInputChange}
        ></textarea>
        {errors.content && <p className="text-error text-sm mt-1">{errors.content}</p>}
      </div>

      {/* Publish Button */}
      <div className="form-control ">
        <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading && <span className="spinner-border spinner-border-sm me-2"></span>}

          {loading ? (mode === "add" ? "Creating..." : "Updating.."): mode === "add" ? "Create" : "Update"}
        </button>
        <button type="button" className="btn " onClick={onCancel}>
    Cancel
  </button>
      </div>
    </form>
  );
}

export default BlogPostForm;