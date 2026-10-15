import React, { useState, useEffect, useContext } from 'react';
import { Table, Typography, Button, Space, Modal, Form, Input, InputNumber, Upload, message, Popconfirm, Select, Card, Tag, Switch, Spin } from 'antd';
import { Edit, Trash2, Plus, Upload as UploadIcon, MinusCircle, Tag as TagIcon, Zap } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../config/api';
import CategoryDiscountsManager from '../../components/admin/CategoryDiscountsManager';

const { Title } = Typography;
const { Option } = Select;



// Stepper input for stock quantity [-] [ Qty ] [+]
const StockStepper = ({ value, onChange, isLowStock }) => {
  const currentVal = Number(value) || 0;

  return (
    <div className={`flex items-center border rounded-lg overflow-hidden bg-white shadow-sm transition-all h-9 ${isLowStock ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200' : 'border-gray-200 hover:border-gray-300'}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (onChange) onChange(Math.max(0, currentVal - 1));
        }}
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 border-r border-gray-200 text-sm font-bold transition-colors select-none cursor-pointer"
      >
        -
      </button>
      <input
        type="number"
        min={0}
        value={currentVal}
        onChange={(e) => {
          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
          if (!isNaN(val) && onChange) onChange(Math.max(0, val));
        }}
        className="w-12 text-center text-xs font-bold text-gray-900 border-0 focus:outline-none focus:ring-0 bg-transparent p-0"
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (onChange) onChange(currentVal + 1);
        }}
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 border-l border-gray-200 text-sm font-bold transition-colors select-none cursor-pointer"
      >
        +
      </button>
    </div>
  );
};

// Dynamic status pill: In Stock / Low Stock Warning / Out of Stock
const renderStatusBadge = (stockVal, thresholdVal) => {
  const stock = Number(stockVal) || 0;
  const threshold = typeof thresholdVal === 'number' ? thresholdVal : 2;

  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        Out of Stock (0)
      </span>
    );
  }
  if (stock < threshold) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-medium shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Low Stock Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      In Stock ({stock})
    </span>
  );
};

// Fast client-side image compression: reduces 10MB phone camera photos to ~250KB in milliseconds
const compressImage = async (file) => {
  // Only compress raster images; skip SVGs, GIFs, and already-small files under 300KB
  if (
    !file ||
    !file.type ||
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif' ||
    file.size <= 300 * 1024
  ) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const MAX_DIM = 1600;
            let { width, height } = img;

            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              return resolve(file);
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob && blob.size < file.size) {
                  const rawName = file.name || 'product.jpg';
                  const fileName = rawName.replace(/\.[^.]+$/, '.jpg');
                  const compressedFile = new File([blob], fileName, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              'image/jpeg',
              0.82
            );
          } catch (canvasErr) {
            console.warn('Canvas compression fallback:', canvasErr);
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('FileReader compression fallback:', err);
      resolve(file);
    }
  });
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [activeMainTab, setActiveMainTab] = useState('catalog'); // 'catalog' | 'discounts'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'discontinued'
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [fileList, setFileList] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?includeInactive=true`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to load products');
    }
  };

  const handleToggleStatus = async (record, checked) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${record._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ isActive: checked }),
      });

      if (response.ok) {
        message.success(checked 
          ? `"${record.name}" is now Active on storefront` 
          : `"${record.name}" deactivated (discontinued & hidden from storefront)`);
        setProducts(prev => prev.map(p => p._id === record._id ? { ...p, isActive: checked } : p));
      } else {
        const err = await response.json();
        message.error(err.message || 'Failed to update product status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update product status');
    }
  };

  const showAddModal = () => {
    setEditingId(null);
    setFileList([]);
    form.resetFields();
    // Default variant & active status
    form.setFieldsValue({ 
      isActive: true,
      variants: [{ size: 'M', stock: 5, threshold: 2 }] 
    });
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingId(record._id);
    
    // Convert existing image URLs to Ant Design Upload fileList format
    const existingFileList = record.images ? record.images.map((img, index) => ({
      uid: `-existing-${index}`,
      name: `Image ${index + 1}`,
      status: 'done',
      url: img,
      response: img
    })) : [];
    
    setFileList(existingFileList);
    
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      category: record.category ? [record.category] : [],
      subCategory: record.subCategory ? [record.subCategory] : [],
      fabric: record.fabric,
      price: record.price,
      isActive: record.isActive !== false,
      variants: record.variants && record.variants.length > 0 ? record.variants.map(v => ({
        size: v.size || '', 
        stock: v.stock !== undefined ? v.stock : 0,
        threshold: v.threshold !== undefined && v.threshold !== null ? v.threshold : 2
      })) : [{ size: 'M', stock: 0, threshold: 2 }]
    });
    
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        message.success('Product deleted successfully');
        fetchProducts();
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('Failed to delete product');
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    setIsModalVisible(false);
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    setSubmitStep('Preparing product specifications...');
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('category', values.category ? (Array.isArray(values.category) ? values.category[0] : values.category) : '');
      formData.append('subCategory', values.subCategory ? (Array.isArray(values.subCategory) ? values.subCategory[0] : values.subCategory) : '');
      formData.append('fabric', values.fabric);
      formData.append('price', values.price);
      formData.append('isActive', values.isActive !== undefined ? values.isActive : true);

      // Process variants
      const processedVariants = values.variants ? values.variants.map((v) => {
        const sizeStr = Array.isArray(v.size) ? (v.size[0] || '') : (v.size || '');
        return { 
          size: sizeStr, 
          stock: Number(v.stock) || 0,
          threshold: v.threshold !== undefined && v.threshold !== null ? Number(v.threshold) : 2
        };
      }) : [];

      formData.append('variants', JSON.stringify(processedVariants));

      // Separate new files from existing images
      const existingImages = [];
      const newFiles = [];

      fileList.forEach(file => {
        const actualFile = file.originFileObj || file;
        // Check if it's a native File object (new upload)
        if (actualFile instanceof File || actualFile instanceof Blob) {
          newFiles.push(actualFile);
        } 
        // Otherwise, if it's an existing image object
        else if (file.response || file.url) {
          existingImages.push(file.response || file.url);
        }
      });

      // Compress and optimize new image uploads in parallel
      if (newFiles.length > 0) {
        setSubmitStep(`Optimizing ${newFiles.length} photo${newFiles.length > 1 ? 's' : ''} for rapid upload...`);
        const optimizedFiles = await Promise.all(newFiles.map(compressImage));
        optimizedFiles.forEach(compressed => {
          formData.append('images', compressed);
        });
      }
      
      if (editingId) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      setSubmitStep(editingId ? 'Saving product changes...' : 'Publishing product to catalog...');

      const url = editingId 
        ? `${API_URL}/api/products/${editingId}`
        : `${API_URL}/api/products`;
        
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (response.ok) {
        message.success(`Product ${editingId ? 'updated' : 'published'} successfully!`);
        setIsModalVisible(false);
        fetchProducts();
      } else {
        const errorData = await response.json();
        message.error(errorData.message || `Failed to ${editingId ? 'update' : 'publish'} product`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      message.error('An error occurred while saving the product');
    } finally {
      setSubmitting(false);
      setSubmitStep('');
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);
      return false; // Prevent automatic upload
    },
    fileList,
    listType: "picture-card"
  };

  const columns = [
    { 
      title: 'Image', 
      key: 'image',
      render: (_, record) => (
        record.images && record.images.length > 0 ? (
          <img 
            src={record.images[0]} 
            alt={record.name} 
            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '4px' }} 
          />
        ) : (
          <div style={{ width: 50, height: 50, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
            No Img
          </div>
        )
      )
    },
    { title: 'Product Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Sub-Category', dataIndex: 'subCategory', key: 'subCategory' },
    { 
      title: 'Price', 
      dataIndex: 'price', 
      key: 'price',
      render: (price) => `LKR ${price.toFixed(2)}`
    },
    { 
      title: 'Stock & Inventory Status', 
      key: 'stock',
      render: (_, record) => {
        const totalStock = record.variants ? record.variants.reduce((acc, variant) => acc + (variant.stock || 0), 0) : 0;
        const lowStockVariants = record.variants ? record.variants.filter(v => (v.stock || 0) < (v.threshold !== undefined && v.threshold !== null ? v.threshold : 2)) : [];

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs">{totalStock} units</span>
              {totalStock === 0 ? (
                <Tag color="red" className="text-[11px]">Out of Stock</Tag>
              ) : lowStockVariants.length > 0 ? (
                <Tag color="volcano" className="text-[11px] font-medium">
                  ⚠️ {lowStockVariants.length} Low Stock
                </Tag>
              ) : (
                <Tag color="green" className="text-[11px]">Healthy</Tag>
              )}
            </div>
            {lowStockVariants.length > 0 && (
              <div className="text-[11px] flex flex-wrap gap-1">
                {lowStockVariants.map((lv, idx) => (
                  <span key={idx} className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[10px]">
                    {lv.size}: <strong>{lv.stock}</strong> (min {lv.threshold ?? 2})
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    { 
      title: 'Storefront Status', 
      key: 'isActive',
      width: 170,
      render: (_, record) => {
        const isActive = record.isActive !== false;
        return (
          <div className="flex items-center gap-2.5">
            <Switch 
              checked={isActive} 
              size="small"
              onChange={(checked) => handleToggleStatus(record, checked)}
              className={isActive ? '!bg-emerald-600' : '!bg-gray-300'}
            />
            {isActive ? (
              <Tag color="success" className="text-[11px] font-medium m-0">
                Active
              </Tag>
            ) : (
              <Tag color="default" className="text-[11px] font-medium m-0 text-gray-500 bg-gray-100 border-gray-200">
                Discontinued
              </Tag>
            )}
          </div>
        );
      }
    },
    { 
      title: 'Actions', 
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<Edit size={16} />} onClick={() => showEditModal(record)} />
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  const filteredProducts = products.filter(p => {
    if (statusFilter === 'active') return p.isActive !== false;
    if (statusFilter === 'discontinued') return p.isActive === false;
    return true;
  });

  return (
    <div>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Title level={2} className="!mb-1">Product & Catalog Management</Title>
          <p className="text-xs text-gray-500 m-0">
            Control product inventory, seasonal category discounts with start/end dates, and storefront visibility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeMainTab === 'catalog' && (
            <Button type="primary" className="bg-black text-xs font-semibold h-9" onClick={showAddModal}>
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveMainTab('catalog')}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
            activeMainTab === 'catalog'
              ? 'text-black border-b-2 border-black font-bold'
              : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          📦 Inventory & Products Catalog ({products.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('discounts')}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeMainTab === 'discounts'
              ? 'text-black border-b-2 border-black font-bold'
              : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          <span>🏷️ Category Discounts & Flash Sales</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            DISCOUNT
          </span>
        </button>
      </div>

      {/* Render Discounts Manager or Products Catalog */}
      {activeMainTab === 'discounts' ? (
        <CategoryDiscountsManager />
      ) : (
        <>
          {/* Filter Tabs & Quick Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-1.5 bg-gray-100/90 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All Items ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-500 hover:text-emerald-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active ({products.filter(p => p.isActive !== false).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('discontinued')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'discontinued'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                Discontinued / Hidden ({products.filter(p => p.isActive === false).length})
              </button>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
            </div>
          </div>
          
          <Table 
            columns={columns} 
            dataSource={filteredProducts} 
            rowKey="_id"
            className="bg-white border border-gray-200 rounded"
          />
        </>
      )}

      <Modal
        title={
          <div className="pb-3 border-b border-gray-100 flex items-center justify-between pr-8">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 block mb-0.5">
                STYLEHUB CONSOLE • INVENTORY ATELIER
              </span>
              <h3 className="font-serif text-2xl text-gray-900 font-normal m-0">
                {editingId ? "Edit Product Specifications" : "Create New Product Catalog Item"}
              </h3>
            </div>
            {editingId && (
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-mono">
                ID: #{editingId.slice(-6).toUpperCase()}
              </span>
            )}
          </div>
        }
        open={isModalVisible}
        onCancel={submitting ? undefined : handleCancel}
        closable={!submitting}
        maskClosable={!submitting}
        footer={null}
        width={1040}
        destroyOnClose
        className="product-editor-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="mt-5 space-y-6"
        >
          {/* Section 1: General Product Details */}
          <div className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-3 mb-5 border-b border-gray-100">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                1
              </span>
              <div>
                <h4 className="font-serif text-base font-semibold text-gray-900 m-0 leading-tight">General Information</h4>
                <p className="text-xs text-gray-400 m-0 mt-0.5">Core attributes, naming, category classification, and retail pricing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Visibility / Discontinued Switch */}
              <div className="md:col-span-12 p-3.5 bg-gray-50/90 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800 block mb-0.5">
                    Storefront Catalog Visibility
                  </span>
                  <span className="text-[11px] text-gray-500">
                    When switched off, this product is deactivated / discontinued and hidden from customer catalog collections and search.
                  </span>
                </div>
                <Form.Item name="isActive" valuePropName="checked" style={{ margin: 0 }}>
                  <Switch 
                    checkedChildren="Active" 
                    unCheckedChildren="Discontinued" 
                    className="!bg-emerald-600"
                  />
                </Form.Item>
              </div>

              {/* Product Name */}
              <div className="md:col-span-8">
                <Form.Item
                  name="name"
                  label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Product Title / Name *</span>}
                  rules={[{ required: true, message: 'Please enter product name' }]}
                >
                  <Input size="large" placeholder="e.g. Structured Wool Blazer" className="rounded-lg text-sm" />
                </Form.Item>
              </div>

              {/* Price */}
              <div className="md:col-span-4">
                <Form.Item
                  name="price"
                  label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Retail Price (LKR) *</span>}
                  rules={[{ required: true, message: 'Please enter price' }]}
                >
                  <InputNumber
                    min={0}
                    step={100}
                    size="large"
                    className="w-full rounded-lg text-sm"
                    prefix={<span className="text-xs font-bold text-gray-400 mr-1">Rs.</span>}
                    placeholder="0.00"
                  />
                </Form.Item>
              </div>

              {/* Category */}
              <div className="md:col-span-4">
                <Form.Item
                  name="category"
                  label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Primary Category *</span>}
                  rules={[{ required: true, message: 'Please select or enter category' }]}
                >
                  <Select 
                    size="large"
                    placeholder="Select a category" 
                    allowClear 
                    mode="tags" 
                    maxCount={1} 
                    onChange={() => form.setFieldsValue({ subCategory: [] })}
                    className="w-full text-sm"
                  >
                    <Option value="Menswear">Menswear</Option>
                    <Option value="Womenswear">Womenswear</Option>
                    <Option value="Accessories">Accessories</Option>
                  </Select>
                </Form.Item>
              </div>

              {/* Sub-Category */}
              <div className="md:col-span-4">
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => prevValues.category !== currentValues.category}
                >
                  {({ getFieldValue }) => {
                    const categoryRaw = getFieldValue('category');
                    const catStr = Array.isArray(categoryRaw) ? categoryRaw[0] : categoryRaw;
                    
                    let subOptions = [];
                    if (catStr === 'Menswear') {
                      subOptions = ['Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Shorts', 'Sarongs'];
                    } else if (catStr === 'Womenswear') {
                      subOptions = ['T-Shirts', 'Blouses & Tops', 'Dresses', 'Frocks', 'Skirts', 'Trousers/Jeans', 'Sarees'];
                    } else if (catStr === 'Accessories') {
                      subOptions = ['Ties', 'Belts', 'Vests', 'Socks'];
                    }

                    return (
                      <Form.Item
                        name="subCategory"
                        label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Sub-Category *</span>}
                        rules={[{ required: true, message: 'Please select sub-category' }]}
                      >
                        <Select 
                          size="large"
                          placeholder={!catStr ? "Select category first" : "Select or type sub-category"} 
                          allowClear 
                          mode="tags" 
                          maxCount={1}
                          notFoundContent={!catStr ? "Select category first" : "Type to add custom"}
                          className="w-full text-sm"
                        >
                          {subOptions.map(opt => (
                            <Option key={opt} value={opt}>{opt}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              </div>

              {/* Fabric / Material */}
              <div className="md:col-span-4">
                <Form.Item
                  name="fabric"
                  label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Fabric & Material *</span>}
                  rules={[{ required: true, message: 'Please enter fabric or material details' }]}
                >
                  <Input size="large" placeholder="e.g. 100% Linen, Silk Lining" className="rounded-lg text-sm" />
                </Form.Item>
              </div>

              {/* Description */}
              <div className="md:col-span-12">
                <Form.Item
                  name="description"
                  label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Product Description *</span>}
                  rules={[{ required: true, message: 'Please enter product description' }]}
                  className="mb-0"
                >
                  <Input.TextArea 
                    rows={3} 
                    placeholder="Enter thorough aesthetic and material description for customer storefront..." 
                    className="rounded-lg text-sm p-3"
                  />
                </Form.Item>
              </div>
            </div>
          </div>

          {/* Section 2: Storefront Media & Gallery */}
          <div className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-gray-100 gap-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <div>
                  <h4 className="font-serif text-base font-semibold text-gray-900 m-0 leading-tight">Storefront Gallery Assets</h4>
                  <p className="text-xs text-gray-400 m-0 mt-0.5">High-resolution gallery photos (up to 5 images). The first image serves as the primary catalog cover.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                  <Zap size={12} className="text-emerald-600 fill-emerald-600" />
                  Fast Auto-Compression Active
                </span>
                <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg">
                  {fileList.length}/5 Images Uploaded
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Upload {...uploadProps}>
                {fileList.length >= 5 ? null : (
                  <div className="p-3 text-center cursor-pointer">
                    <UploadIcon size={20} className="mx-auto text-gray-500 mb-1" />
                    <div className="text-xs font-semibold text-gray-700">Upload Photo</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP</div>
                  </div>
                )}
              </Upload>
            </div>
          </div>

          {/* Section 3: Inventory & Variations Matrix */}
          <div className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-3 mb-4 border-b border-gray-100">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                3
              </span>
              <div>
                <h4 className="font-serif text-base font-semibold text-gray-900 m-0 leading-tight">Inventory & Variations Matrix</h4>
                <p className="text-xs text-gray-400 m-0 mt-0.5">Configure sizing, individual stock, and alert thresholds (threshold = 2)</p>
              </div>
            </div>

            <div className="bg-[#fcfaf8] border border-gray-200 rounded-xl p-5">
              <Form.Item
                noStyle
                shouldUpdate
              >
                {({ getFieldValue }) => {
                  const variantsList = getFieldValue('variants') || [];
                  const totalCombinedUnits = variantsList.reduce((sum, v) => sum + (Number(v?.stock) || 0), 0);

                  return (
                    <div>
                      {/* Top Bulk Helpers Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-gray-200/80 mb-4">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-bold text-[10px] tracking-wider uppercase text-gray-400">BULK HELPERS:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = form.getFieldValue('variants') || [];
                              form.setFieldsValue({
                                variants: cur.map(v => ({ ...v, threshold: 2 }))
                              });
                              message.success('Applied threshold (2) to all variants');
                            }}
                            className="text-gray-700 hover:text-black hover:underline font-medium cursor-pointer"
                          >
                            Apply threshold (2) to all
                          </button>
                        </div>

                        <div className="text-xs text-gray-500 font-medium">
                          Total Combined Units: <strong className="text-gray-900 font-bold">{totalCombinedUnits}</strong>
                        </div>
                      </div>

                      {/* Table View */}
                      <div className="overflow-x-auto pb-2">
                        <div className="min-w-[700px]">
                          {/* Headers */}
                          <div className="grid grid-cols-[160px_180px_150px_140px_40px] gap-3 px-2 pb-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase border-b border-gray-100 mb-3 items-center">
                            <div>SIZE</div>
                            <div>INVENTORY STOCK</div>
                            <div>MIN. ALERT LEVEL</div>
                            <div>STATUS</div>
                            <div className="text-center">ACTIONS</div>
                          </div>

                          {/* Variant rows */}
                          <Form.List name="variants">
                            {(fields, { add, remove }) => (
                              <div className="space-y-2.5">
                                {fields.map(({ key, name, ...restField }) => {
                                  const currentVar = variantsList[name] || {};
                                  const isLow = (Number(currentVar.stock) || 0) < (typeof currentVar.threshold === 'number' ? currentVar.threshold : 2);

                                  return (
                                    <div 
                                      key={key} 
                                      className="grid grid-cols-[160px_180px_150px_140px_40px] gap-3 px-2 py-2 items-center bg-white hover:bg-neutral-50/70 rounded-lg transition-colors border border-gray-100 shadow-sm"
                                    >
                                      {/* SIZE (Plain text input - no dropdown) */}
                                      <div>
                                        <Form.Item
                                          {...restField}
                                          name={[name, 'size']}
                                          rules={[{ required: true, message: 'Size required' }]}
                                          style={{ margin: 0 }}
                                        >
                                          <Input
                                            placeholder="e.g. S, M, L, 32"
                                            className="h-9 rounded-lg border-gray-200 shadow-sm text-xs font-medium"
                                          />
                                        </Form.Item>
                                      </div>

                                      {/* INVENTORY STOCK */}
                                      <div>
                                        <Form.Item
                                          {...restField}
                                          name={[name, 'stock']}
                                          rules={[{ required: true, message: 'Required' }]}
                                          style={{ margin: 0 }}
                                        >
                                          <StockStepper isLowStock={isLow} />
                                        </Form.Item>
                                      </div>

                                      {/* MIN. ALERT LEVEL */}
                                      <div className="flex items-center gap-1.5">
                                        <Form.Item
                                          {...restField}
                                          name={[name, 'threshold']}
                                          rules={[{ required: true, message: 'Required' }]}
                                          style={{ margin: 0 }}
                                          initialValue={2}
                                        >
                                          <InputNumber
                                            min={0}
                                            controls={false}
                                            className="w-14 text-center text-xs font-semibold rounded-lg border-gray-200 shadow-sm h-9 !flex items-center justify-center"
                                            placeholder="2"
                                          />
                                        </Form.Item>
                                        <span className="text-xs text-gray-400 font-sans">units</span>
                                      </div>

                                      {/* STATUS */}
                                      <div>
                                        {renderStatusBadge(currentVar.stock, currentVar.threshold)}
                                      </div>

                                      {/* ACTIONS */}
                                      <div className="flex justify-center">
                                        <button
                                          type="button"
                                          onClick={() => remove(name)}
                                          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                          title="Remove variant"
                                        >
                                          <MinusCircle size={18} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Add Another Variant Button */}
                                <button
                                  type="button"
                                  onClick={() => add({ size: '', stock: 0, threshold: 2 })}
                                  className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 hover:border-black rounded-xl text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-50/50 transition-all flex items-center justify-center gap-2 tracking-wide uppercase shadow-sm cursor-pointer"
                                >
                                  <Plus size={16} />
                                  <span>Add Another Variant</span>
                                </button>
                              </div>
                            )}
                          </Form.List>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </Form.Item>
            </div>
          </div>

          {/* Active Publishing Banner when submitting */}
          {submitting && (
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between text-white shadow-lg animate-pulse">
              <div className="flex items-center gap-3">
                <Spin size="small" />
                <span className="text-xs font-semibold tracking-wide">
                  {submitStep || 'Publishing product to catalog...'}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono font-medium">
                Fast Upload Active
              </span>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-400">
              All inventory stock thresholds and details sync in real time across StyleHub Sri Lanka.
            </span>
            <Space size="middle">
              <Button 
                onClick={handleCancel} 
                disabled={submitting}
                className="h-10 px-5 rounded-lg text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
                disabled={submitting}
                className="bg-black text-white hover:bg-neutral-800 h-10 px-7 rounded-lg text-xs font-bold tracking-wider uppercase shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting 
                  ? (editingId ? "Saving..." : "Publishing...") 
                  : (editingId ? "Save Product Changes" : "Publish Product")}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminProducts;
