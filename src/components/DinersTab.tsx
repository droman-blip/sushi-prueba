import React, { useState } from 'react';
import {
  Check,
  Copy,
  Crown,
  Link2,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { ALLERGENS_MAP, DINER_COLORS, MENU_TYPES } from '../data/menu';
import { Diner, DinerRole, MenuType, OrderLine } from '../types';
import {
  DinerSummary,
  formatEuros,
  getDinerDrinkCount,
} from '../utils/calculations';
import { PWAInstallButton } from './PWAInstallButton';

interface DinersTabProps {
  diners: Diner[];
  summaries: DinerSummary[];
  allLines: OrderLine[];
  roomCode?: string;
  inviteUrl?: string;
  currentDinerId?: string;
  hostDinerId?: string;
  inviteCopied?: boolean;
  onCopyInvite?: () => void;
  onAddDiner: (diner: Omit<Diner, 'id'>) => void;
  onUpdateDiner: (diner: Diner) => void;
  onRemoveDiner: (dinerId: string) => void;
  onGoToMenu: () => void;
}

const MENU_TYPE_ORDER: MenuType[] = [
  'infinity_adulto',
  'infinity_infantil',
  'menu_del_dia',
  'carta',
];

const ALLERGEN_IDS = Object.keys(ALLERGENS_MAP).map(Number);

export const DinersTab: React.FC<DinersTabProps> = ({
  diners,
  allLines,
  roomCode,
  inviteUrl,
  currentDinerId,
  hostDinerId,
  inviteCopied = false,
  onCopyInvite,
  onAddDiner,
  onUpdateDiner,
  onRemoveDiner,
  onGoToMenu,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(DINER_COLORS[0].hex);
  const [menuType, setMenuType] = useState<MenuType>('infinity_adulto');
  const [role, setRole] = useState<DinerRole>(
    diners.length === 0 ? 'anfitrion' : 'invitado'
  );
  const [allergies, setAllergies] = useState<number[]>([]);
  const [formOpen, setFormOpen] = useState(diners.length === 0);
  const [errorMsg, setErrorMsg] = useState('');

  const openNewForm = () => {
    setEditingId(null);
    setName('');
    const nextColor = DINER_COLORS[diners.length % DINER_COLORS.length].hex;
    setColor(nextColor);
    const hasHost = diners.some((d) => d.role === 'anfitrion');
    setRole(hasHost ? 'invitado' : 'anfitrion');
    setMenuType('infinity_adulto');
    setAllergies([]);
    setErrorMsg('');
    setFormOpen(true);
  };

  const openEditForm = (diner: Diner) => {
    setEditingId(diner.id);
    setName(diner.name);
    setColor(diner.color);
    setMenuType(diner.menuType);
    setRole(diner.role ?? 'invitado');
    setAllergies(diner.allergies ?? []);
    setErrorMsg('');
    setFormOpen(true);
  };

  const toggleAllergy = (id: number) => {
    setAllergies((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Escribe el nombre del comensal.');
      return;
    }
    if (editingId) {
      onUpdateDiner({
        id: editingId,
        name: trimmed,
        color,
        menuType,
        role,
        allergies,
      });
    } else {
      onAddDiner({
        name: trimmed,
        color,
        menuType,
        role,
        allergies,
      });
    }
    setName('');
    setEditingId(null);
    setAllergies([]);
    setErrorMsg('');
    setFormOpen(false);
  };

  const hasInfinity = diners.some(
    (d) =>
      d.menuType === 'infinity_adulto' || d.menuType === 'infinity_infantil'
  );
  const hasNonInfinity = diners.some(
    (d) => d.menuType === 'menu_del_dia' || d.menuType === 'carta'
  );

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#141414]">
            Comensales en la mesa
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Configura a tus amigos, su rol, su menú y sus alergias antes de pedir.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!formOpen && (
            <button
              type="button"
              onClick={openNewForm}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#141414] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-stone-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Añadir amigo
            </button>
          )}
          {diners.length > 0 && (
            <button
              type="button"
              onClick={onGoToMenu}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E24C3B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#cf4030] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ir a la Carta
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Room Invite & PWA Card */}
      {roomCode && (
        <div className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
              <span className="font-bold text-[#141414]">Sala online en vivo</span>
              <span aria-hidden="true">·</span>
              <span>
                Código:{' '}
                <strong className="font-mono text-sm tracking-widest text-[#E24C3B]">
                  {roomCode}
                </strong>
              </span>
            </div>
            {inviteUrl && (
              <p className="text-xs text-stone-500 font-mono truncate">
                {inviteUrl}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onCopyInvite && (
              <button
                type="button"
                onClick={onCopyInvite}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  inviteCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#141414] hover:bg-stone-800 text-white'
                }`}
              >
                {inviteCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Enlace copiado!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 text-[#E24C3B]" />
                    <Copy className="w-3.5 h-3.5 opacity-80" />
                    <span>Copiar enlace (?sala={roomCode})</span>
                  </>
                )}
              </button>
            )}
            <PWAInstallButton />
          </div>
        </div>
      )}

      {/* PDF Rule Notice if mixed menus */}
      {hasInfinity && hasNonInfinity && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-950">
            <p className="font-semibold">Aviso de carta Sushisom</p>
            <p className="text-amber-800 mt-0.5">
              Según la carta oficial, la elección del Menú Infinity es válida solo para todos los comensales de la mesa.
            </p>
          </div>
        </div>
      )}

      {/* Main 2-column responsive layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main: Diners list */}
        <div className="lg:col-span-7 space-y-3">
          {diners.length === 0 ? (
            <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#141414]">
                La mesa aún está vacía
              </h3>
              <p className="text-sm text-stone-600 mt-1 max-w-sm mx-auto">
                Añade a los amigos de la mesa para asignar platos, detectar alergias y medir la rentabilidad del bufet.
              </p>
              {!formOpen && (
                <button
                  type="button"
                  onClick={openNewForm}
                  className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E24C3B] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#cf4030] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Añadir primer comensal
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {diners.map((diner) => {
                const info = MENU_TYPES[diner.menuType];
                const drinkCount = getDinerDrinkCount(diner.id, allLines);
                const needsDrink =
                  (diner.menuType === 'infinity_adulto' ||
                    diner.menuType === 'infinity_infantil') &&
                  drinkCount === 0;
                const initial = diner.name.trim().slice(0, 2).toUpperCase();
                const dinerAllergies = diner.allergies ?? [];
                const isRoomHost = hostDinerId
                  ? diner.id === hostDinerId
                  : diner.role === 'anfitrion';
                const isMe = currentDinerId === diner.id;
                const roleLabel = isRoomHost ? 'Anfitrión' : 'Invitado';

                return (
                  <div
                    key={diner.id}
                    className={`rounded-2xl bg-white border p-4 flex items-center justify-between gap-3 ${
                      isMe ? 'border-[#E24C3B]/60' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                        style={{ backgroundColor: diner.color }}
                        aria-hidden="true"
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <h3 className="text-base font-bold text-[#141414] truncate">
                            {diner.name}
                          </h3>
                          {isMe && (
                            <span className="text-xs font-bold text-[#E24C3B]">
                              · Tú
                            </span>
                          )}
                          <span className="text-xs font-medium text-stone-500 inline-flex items-center gap-1">
                            · {isRoomHost && <Crown className="w-3 h-3 text-[#E24C3B]" />}
                            {roleLabel}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-600 mt-0.5">
                          <span className="font-medium text-stone-800">
                            {info.label}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums font-semibold text-[#141414]">
                            {info.basePrice > 0
                              ? formatEuros(info.basePrice)
                              : 'Por consumo'}
                          </span>
                          {needsDrink && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700 font-medium">
                                Falta bebida mín.
                              </span>
                            </>
                          )}
                        </div>
                        {dinerAllergies.length > 0 && (
                          <p className="text-[11px] text-red-700 font-medium mt-1">
                            Alergias:{' '}
                            {dinerAllergies
                              .map((id) => ALLERGENS_MAP[id])
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditForm(diner)}
                        aria-label={`Editar a ${diner.name}`}
                        className="min-h-[44px] min-w-[44px] rounded-xl text-stone-600 hover:text-[#141414] hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!isRoomHost && (
                        <button
                          type="button"
                          onClick={() => onRemoveDiner(diner.id)}
                          aria-label={`Eliminar a ${diner.name}`}
                          className="min-h-[44px] min-w-[44px] rounded-xl text-stone-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Add / Edit Diner Form & Menu Reference */}
        <div className="lg:col-span-5 space-y-4">
          {formOpen && (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-white border border-stone-200 p-5 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#141414]">
                  {editingId ? 'Editar comensal' : 'Nuevo comensal'}
                </h3>
                {diners.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormOpen(false);
                      setEditingId(null);
                      setErrorMsg('');
                    }}
                    className="text-xs font-semibold text-stone-500 hover:text-[#141414] py-2 px-3 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              <div>
                <label
                  htmlFor="diner-name"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Nombre
                </label>
                <input
                  id="diner-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Ej: Laura, Carlos, Dani..."
                  autoFocus
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 bg-[#F7F6F3] text-sm font-medium text-[#141414] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#E24C3B] focus:bg-white transition-all"
                />
                {errorMsg && (
                  <p className="text-xs text-red-600 font-medium mt-1.5">
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Role selector (locked in active online rooms where host is exclusive) */}
              {!roomCode && (
                <div>
                  <span className="block text-xs font-semibold text-stone-700 mb-2">
                    Rol en la sala
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'anfitrion', label: 'Anfitrión' },
                        { id: 'invitado', label: 'Invitado' },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRole(item.id)}
                        className={`min-h-[42px] px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          role === item.id
                            ? 'border-[#141414] bg-[#141414] text-white'
                            : 'border-stone-200 bg-[#F7F6F3] text-[#141414] hover:border-stone-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="block text-xs font-semibold text-stone-700 mb-2">
                  Color identificativo
                </span>
                <div className="flex flex-wrap gap-2">
                  {DINER_COLORS.map((c) => {
                    const selected = color === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setColor(c.hex)}
                        aria-label={`Color ${c.name}`}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                          selected
                            ? 'ring-2 ring-offset-2 ring-[#141414] scale-105'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {selected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-stone-700 mb-2">
                  Tipo de menú (Carta Mediodía)
                </span>
                <div className="space-y-2">
                  {MENU_TYPE_ORDER.map((typeKey) => {
                    const m = MENU_TYPES[typeKey];
                    const selected = menuType === typeKey;
                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setMenuType(typeKey)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          selected
                            ? 'border-[#141414] bg-[#141414] text-white'
                            : 'border-stone-200 bg-[#F7F6F3] text-[#141414] hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold">{m.label}</span>
                          <span className="font-mono tabular-nums text-sm font-bold">
                            {m.basePrice > 0 ? formatEuros(m.basePrice) : 'Carta'}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-1 ${
                            selected ? 'text-stone-300' : 'text-stone-600'
                          }`}
                        >
                          {m.summary}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergies multi-select */}
              <div>
                <span className="block text-xs font-semibold text-stone-700 mb-2">
                  Alergias o intolerancias (opcional)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ALLERGEN_IDS.map((id) => {
                    const active = allergies.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleAllergy(id)}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-stone-200 bg-[#F7F6F3] text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        {ALLERGENS_MAP[id]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-[#E24C3B] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#cf4030] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {editingId ? 'Guardar cambios' : 'Añadir a la mesa'}
              </button>
            </form>
          )}

          {/* Compact Official Rules Card */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#141414]">
              Reglas de la carta Sushisom (Mediodía)
            </h3>
            <ul className="space-y-2 text-xs text-stone-600 leading-relaxed">
              <li>
                <strong className="text-[#141414]">
                  Menú Infinity (17,90€ / 12,90€):
                </strong>{' '}
                máximo 5 platos por ronda y por persona. Bebida mínima obligatoria (1 por comensal). Postres aparte.
              </li>
              <li>
                <strong className="text-[#141414]">
                  Menú del Día (15,90€):
                </strong>{' '}
                4 platos (excepto Sushi Mixto y Postres) + 1 bebida (excepto Asahi, Sapporo o Sake) + 1 café.
              </li>
              <li>
                <strong className="text-[#141414]">Penalización:</strong>{' '}
                2,00€ por cada plato pedido y no consumido en la mesa.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
