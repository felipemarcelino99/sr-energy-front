import type { Dispatch, SetStateAction } from 'react'

export interface JobLocationData {
  city: string
  state: string
  address: string
  accommodation: boolean
  car: boolean
  startTime: string
  endTime: string
  carPickupTime: string
  carReturnTime: string
  carPickupAddress: string
  serviceAddress: string
  clientContactName: string
  clientContactPhone: string
}

interface JobLocationFieldsProps {
  value: JobLocationData
  onChange: Dispatch<SetStateAction<JobLocationData>>
  errors?: Record<string, string>
}

/** Bloco "Local" — reaproveitado pelo `JobStepper` (criação) e pelo `JobEditTabs` (edição). */
export function JobLocationFields({ value, onChange, errors = {} }: JobLocationFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="city">
          Cidade
        </label>
        <input
          id="city"
          type="text"
          className={`input input-bordered w-full ${errors.city ? 'input-error' : ''}`}
          value={value.city}
          onChange={(e) => onChange((p) => ({ ...p, city: e.target.value }))}
        />
        {errors.city && (
          <p data-testid="error-city" className="text-error text-xs">
            {errors.city}
          </p>
        )}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="state">
          Estado
        </label>
        <input
          id="state"
          type="text"
          maxLength={2}
          placeholder="SP"
          className={`input input-bordered w-full ${errors.state ? 'input-error' : ''}`}
          value={value.state}
          onChange={(e) => onChange((p) => ({ ...p, state: e.target.value.toUpperCase() }))}
        />
        {errors.state && (
          <p data-testid="error-state" className="text-error text-xs">
            {errors.state}
          </p>
        )}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="address">
          Endereço <span className="text-base-content/30">(opcional)</span>
        </label>
        <input
          id="address"
          type="text"
          placeholder="Rua, número, bairro…"
          className="input input-bordered w-full"
          value={value.address}
          onChange={(e) => onChange((p) => ({ ...p, address: e.target.value }))}
        />
      </fieldset>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox"
            checked={value.accommodation}
            onChange={(e) => onChange((p) => ({ ...p, accommodation: e.target.checked }))}
          />
          <span className="text-sm">Hospedagem</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox"
            checked={value.car}
            onChange={(e) => onChange((p) => ({ ...p, car: e.target.checked }))}
          />
          <span className="text-sm">Carro</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="startTime">
            Horário de Início
          </label>
          <input
            id="startTime"
            type="time"
            className={`input input-bordered w-full ${errors.startTime ? 'input-error' : ''}`}
            value={value.startTime}
            onChange={(e) => onChange((p) => ({ ...p, startTime: e.target.value }))}
          />
          {errors.startTime && (
            <p data-testid="error-startTime" className="text-error text-xs">
              {errors.startTime}
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="endTime">
            Horário de Término
          </label>
          <input
            id="endTime"
            type="time"
            className={`input input-bordered w-full ${errors.endTime ? 'input-error' : ''}`}
            value={value.endTime}
            onChange={(e) => onChange((p) => ({ ...p, endTime: e.target.value }))}
          />
          {errors.endTime && (
            <p data-testid="error-endTime" className="text-error text-xs">
              {errors.endTime}
            </p>
          )}
        </fieldset>
      </div>

      {value.car && (
        <div className="card bg-base-200 p-3 flex flex-col gap-3">
          <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
            Carro alugado
          </p>
          <div className="grid grid-cols-2 gap-3">
            <fieldset className="fieldset gap-1">
              <label
                className="label text-xs font-medium text-base-content/60"
                htmlFor="carPickupTime"
              >
                Retirada
              </label>
              <input
                id="carPickupTime"
                type="time"
                className="input input-bordered w-full"
                value={value.carPickupTime}
                onChange={(e) => onChange((p) => ({ ...p, carPickupTime: e.target.value }))}
              />
            </fieldset>
            <fieldset className="fieldset gap-1">
              <label
                className="label text-xs font-medium text-base-content/60"
                htmlFor="carReturnTime"
              >
                Devolução
              </label>
              <input
                id="carReturnTime"
                type="time"
                className="input input-bordered w-full"
                value={value.carReturnTime}
                onChange={(e) => onChange((p) => ({ ...p, carReturnTime: e.target.value }))}
              />
            </fieldset>
          </div>
          <fieldset className="fieldset gap-1">
            <label
              className="label text-xs font-medium text-base-content/60"
              htmlFor="carPickupAddress"
            >
              Endereço da locadora <span className="text-base-content/30">(opcional)</span>
            </label>
            <input
              id="carPickupAddress"
              type="text"
              placeholder="Endereço da locadora…"
              className="input input-bordered w-full"
              value={value.carPickupAddress}
              onChange={(e) => onChange((p) => ({ ...p, carPickupAddress: e.target.value }))}
            />
          </fieldset>
        </div>
      )}

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="serviceAddress">
          Endereço de atendimento <span className="text-base-content/30">(opcional)</span>
        </label>
        <input
          id="serviceAddress"
          type="text"
          className="input input-bordered w-full"
          value={value.serviceAddress}
          onChange={(e) => onChange((p) => ({ ...p, serviceAddress: e.target.value }))}
        />
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <fieldset className="fieldset gap-1">
          <label
            className="label text-xs font-medium text-base-content/60"
            htmlFor="clientContactName"
          >
            Contato do cliente <span className="text-base-content/30">(opcional)</span>
          </label>
          <input
            id="clientContactName"
            type="text"
            className="input input-bordered w-full"
            value={value.clientContactName}
            onChange={(e) => onChange((p) => ({ ...p, clientContactName: e.target.value }))}
          />
        </fieldset>
        <fieldset className="fieldset gap-1">
          <label
            className="label text-xs font-medium text-base-content/60"
            htmlFor="clientContactPhone"
          >
            Telefone do contato <span className="text-base-content/30">(opcional)</span>
          </label>
          <input
            id="clientContactPhone"
            type="text"
            className="input input-bordered w-full"
            value={value.clientContactPhone}
            onChange={(e) => onChange((p) => ({ ...p, clientContactPhone: e.target.value }))}
          />
        </fieldset>
      </div>
    </div>
  )
}
