import { User, Mail, Phone, MapPin } from 'lucide-react'

function CustomerForm({ customer = {}, onChange }) {
  const update = (field, value) => onChange({ ...customer, [field]: value })

  return (
    <section className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
          <User size={14} className="text-violet-600" />
        </div>
        <h2 className="section-label">Bill To</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Customer / Company Name</label>
          <input
            type="text"
            value={customer.name || ''}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Acme Corporation"
            className="inp text-base font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
            <Mail size={11} className="text-gray-400" /> Email
          </label>
          <input
            type="email"
            value={customer.email || ''}
            onChange={(e) => update('email', e.target.value)}
            placeholder="billing@acme.com"
            className="inp"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
            <Phone size={11} className="text-gray-400" /> Phone
          </label>
          <input
            type="tel"
            value={customer.phone || ''}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+1 234 567 8900"
            className="inp"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
            <MapPin size={11} className="text-gray-400" /> Address
          </label>
          <textarea
            value={customer.address || ''}
            onChange={(e) => update('address', e.target.value)}
            placeholder="123 Main Street, City, State, ZIP, Country"
            rows={2}
            className="inp resize-none"
          />
        </div>
      </div>
    </section>
  )
}

export default CustomerForm
