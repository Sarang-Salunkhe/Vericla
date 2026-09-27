import { useId } from 'react'
import type { UserRole } from '../services/analysis'

interface RoleSelectorProps {
  value: UserRole
  onChange: (role: UserRole) => void
  disabled?: boolean
}

const ROLES: { id: UserRole; label: string; desc: string }[] = [
  { id: 'General Analysis', label: 'General Analysis', desc: 'Standard balanced overview of all clauses and obligations' },
  { id: 'Tenant', label: 'Tenant', desc: 'Prioritizes rent, deposit, maintenance, notice & lease terms' },
  { id: 'Employee', label: 'Employee', desc: 'Prioritizes salary, duties, severance, non-compete & termination' },
  { id: 'Freelancer', label: 'Freelancer / Contractor', desc: 'Prioritizes deliverables, payment terms, IP & invoicing' },
  { id: 'Customer', label: 'Customer', desc: 'Prioritizes refund policies, warranties, liability & cancellation' },
  { id: 'Employer', label: 'Employer', desc: 'Prioritizes compliance, confidentiality & restrictive covenants' },
  { id: 'Business Owner', label: 'Business Owner', desc: 'Prioritizes indemnification, governing law, arbitration & breach' },
  { id: 'Other', label: 'Other Perspective', desc: 'General document analysis tailored for custom requirements' },
]

export function RoleSelector({ value, onChange, disabled = false }: RoleSelectorProps) {
  const selectId = useId()

  return (
    <div className="v-role-card">
      <div className="v-role-header">
        <label htmlFor={selectId} className="v-role-label">
          Perspective / Role Context
        </label>
        <span className="v-role-help">
          Your role helps Vericla prioritize relevant information. It does not change what the document says.
        </span>
      </div>

      <div className="v-role-select-wrapper">
        <select
          id={selectId}
          className="v-role-select"
          value={value}
          onChange={(e) => onChange(e.target.value as UserRole)}
          disabled={disabled}
          aria-label="Choose the role context for analysis"
        >
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label} — {r.desc}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
