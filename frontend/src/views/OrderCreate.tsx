import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonPrimary from '../components/ButtonPrimary';
import Panel from '../components/Panel';
import { createOrderIntent } from '../lib/tx'; // Placeholder
import { useAlertStore } from '../state/alert.store';

const OrderCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlertStore();
  const [formData, setFormData] = useState({
    originShopId: '',
    destinationRegion: '',
    commodityId: '',
    quantity: 1,
    maxTotal: 1,
    expiry: 24,
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validate = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.originShopId) newErrors.originShopId = 'Required';
    if (!formData.destinationRegion) newErrors.destinationRegion = 'Required';
    if (!formData.commodityId) newErrors.commodityId = 'Required';
    if (formData.quantity < 1) newErrors.quantity = 'Must be at least 1';
    if (formData.maxTotal < 1) newErrors.maxTotal = 'Must be at least 1';
    if (formData.expiry < 1 || formData.expiry > 168) newErrors.expiry = 'Between 1 and 168';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        const orderId = await createOrderIntent(formData);
        showAlert('Order created.', 'success');
        navigate(`/quotes/${orderId}`);
      } catch (error) {
        showAlert('Action not allowed.', 'error');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? Number(value) : value,
    });
  };

  return (
    <div className="max-w-lg mx-auto mt-10">
      <Panel>
        <h1 className="text-2xl font-bold mb-6">Create Order</h1>
        <form onSubmit={handleSubmit}>
           <div className="space-y-4">
            <div>
              <label className="block text-text-dim">Origin shop id</label>
              <input type="text" name="originShopId" value={formData.originShopId} onChange={handleChange} className="w-full bg-panel border border-line rounded p-2" />
              {errors.originShopId && <p className="text-error text-sm">{errors.originShopId}</p>}
            </div>
            <div>
              <label className="block text-text-dim">Destination region</label>
              <input type="text" name="destinationRegion" value={formData.destinationRegion} onChange={handleChange} className="w-full bg-panel border border-line rounded p-2" />
              {errors.destinationRegion && <p className="text-error text-sm">{errors.destinationRegion}</p>}
            </div>
            <div>
              <label className="block text-text-dim">Commodity id</label>
              <input type="text" name="commodityId" value={formData.commodityId} onChange={handleChange} className="w-full bg-panel border border-line rounded p-2" />
              {errors.commodityId && <p className="text-error text-sm">{errors.commodityId}</p>}
            </div>
            <div>
              <label className="block text-text-dim">Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full bg-panel border border-line rounded p-2" />
              {errors.quantity && <p className="text-error text-sm">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-text-dim">Max total</label>
              <input type="number" name="maxTotal" value={formData.maxTotal} onChange={handleChange} className="w-full bg-panel border border-line rounded p-2" />
              {errors.maxTotal && <p className="text-error text-sm">{errors.maxTotal}</p>}
            </div>
            <div>
              <label className="block text-text-dim">Expiry (hours from now)</label>
              <input type="number" name="expiry" value={formData.expiry} onChange={handleChange} className="w-full bg-panel border border-line rounded p-2" />
              {errors.expiry && <p className="text-error text-sm">{errors.expiry}</p>}
            </div>
          </div>
          <div className="mt-6">
            <ButtonPrimary type="submit" data-testid="order-create-submit">Create order</ButtonPrimary>
          </div>
        </form>
      </Panel>
    </div>
  );
};

export default OrderCreate;
