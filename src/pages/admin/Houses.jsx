import { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge, Alert } from "../../components/ui";
import {
  getHouses,
  addHouse,
  deleteHouse,
  isHouseOccupied,
} from "../../services/houseService";
import { useRealtime } from "../../hooks/useRealtime";
import { ADMIN_HOUSES } from "../../data/estateConfig";

export default function Houses() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await getHouses();
      setHouses(data);
    } catch (err) {
      setError("Failed to load house numbers.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);
  useRealtime(
    "houses",
    useCallback(() => reload(), [reload]),
  );

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3500);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    const value = input.trim().toUpperCase();
    if (!value) {
      setError("Please enter a house number.");
      return;
    }

    setAdding(true);
    try {
      await addHouse(value);
      await reload();
      setInput("");
      showSuccess(`${value} added successfully.`);
    } catch (err) {
      setError(err.message);
    }
    setAdding(false);
  };

  const handleDelete = async (house) => {
    setDeleteLoading(true);
    setError("");
    try {
      const occupied = await isHouseOccupied(house.houseNumber);
      if (occupied) {
        setError(
          `${house.houseNumber} cannot be removed — it is currently assigned to a resident. ` +
            `Remove or reassign the resident first.`,
        );
        setDeleteConfirm(null);
        setDeleteLoading(false);
        return;
      }
      await deleteHouse(house.id);
      await reload();
      setDeleteConfirm(null);
      showSuccess(`${house.houseNumber} removed from the estate.`);
    } catch (err) {
      setError(err.message);
    }
    setDeleteLoading(false);
  };

  const filtered = houses.filter((h) =>
    h.houseNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const occupied = houses.filter((h) =>
    /* We don't track occupation here but admins can see admin houses */
    ADMIN_HOUSES.includes(h.houseNumber),
  ).length;

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='flex flex-col items-center gap-3'>
          <svg
            className='animate-spin w-6 h-6 text-green-500'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8v8H4z'
            />
          </svg>
          <p className='text-sm text-zinc-400'>Loading houses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in'>
      {/* Header */}
      <div>
        <h2 className='font-display font-bold text-zinc-900 text-xl'>
          House Numbers
        </h2>
        <p className='text-sm text-zinc-400 mt-0.5'>
          Manage all registered house numbers in Stream Drive
        </p>
      </div>

      {success && <Alert variant='success'>{success}</Alert>}
      {error && <Alert variant='danger'>{error}</Alert>}

      {/* Add house form */}
      <Card className='p-5'>
        <h3 className='font-display font-bold text-zinc-900 text-sm mb-4'>
          Add House Number
        </h3>
        <form onSubmit={handleAdd} className='flex gap-3'>
          <div className='flex-1 flex flex-col gap-1.5'>
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              placeholder='e.g. SD-21 or SD-21A'
              className='w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all uppercase'
              style={{ textTransform: "uppercase" }}
            />
            <p className='text-xs text-zinc-400'>
              Format: SD-XX or SD-XXA / SD-XXB for split houses.
              Auto-capitalised.
            </p>
          </div>
          <Button
            type='submit'
            size='md'
            loading={adding}
            className='self-start'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <line x1='12' y1='5' x2='12' y2='19' />
              <line x1='5' y1='12' x2='19' y2='12' />
            </svg>
            Add
          </Button>
        </form>
      </Card>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-4'>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Total
          </p>
          <p className='font-display font-bold text-2xl text-zinc-900'>
            {houses.length}
          </p>
          <p className='text-xs text-zinc-400'>house numbers</p>
        </Card>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Admin Houses
          </p>
          <p className='font-display font-bold text-2xl text-green-600'>
            {occupied}
          </p>
          <p className='text-xs text-zinc-400'>with admin access</p>
        </Card>
        <Card className='p-4 flex flex-col gap-1'>
          <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Available
          </p>
          <p className='font-display font-bold text-2xl text-zinc-900'>
            {houses.length - occupied}
          </p>
          <p className='text-xs text-zinc-400'>non-admin houses</p>
        </Card>
      </div>

      {/* Search */}
      <div className='relative'>
        <svg
          className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <circle cx='11' cy='11' r='8' />
          <line x1='21' y1='21' x2='16.65' y2='16.65' />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search house numbers...'
          className='w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
        />
      </div>

      {/* Houses list */}
      <Card className='overflow-hidden'>
        <div className='px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between'>
          <span className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            House Number
          </span>
          <span className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
            Actions
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 gap-3 text-center'>
            <div className='w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center'>
              <svg
                className='w-5 h-5 text-zinc-400'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' />
                <polyline points='9 22 9 12 15 12 15 22' />
              </svg>
            </div>
            <div>
              <p className='text-sm font-semibold text-zinc-500'>
                No house numbers found
              </p>
              <p className='text-xs text-zinc-400 mt-0.5'>
                {search
                  ? "Try a different search"
                  : "Add your first house number above"}
              </p>
            </div>
          </div>
        ) : (
          <div className='divide-y divide-zinc-100'>
            {filtered.map((house) => {
              const isAdmin = ADMIN_HOUSES.includes(house.houseNumber);
              return (
                <div
                  key={house.id}
                  className='flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0'>
                      <svg
                        className='w-4 h-4 text-green-600'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                      >
                        <path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' />
                        <polyline points='9 22 9 12 15 12 15 22' />
                      </svg>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold text-zinc-900 font-mono'>
                        {house.houseNumber}
                      </span>
                      {isAdmin && <Badge variant='admin'>Admin</Badge>}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(house)}
                    className='p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors'
                    title='Remove house'
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                    >
                      <polyline points='3 6 5 6 21 6' />
                      <path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
                      <path d='M10 11v6M14 11v6' />
                      <path d='M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2' />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className='px-5 py-3 border-t border-zinc-100 bg-zinc-50'>
          <p className='text-xs text-zinc-400'>
            Showing {filtered.length} of {houses.length} house numbers ·
            Duplicates are prevented at database level
          </p>
        </div>
      </Card>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
          <div
            className='fixed inset-0 bg-black/30'
            onClick={() => setDeleteConfirm(null)}
          />
          <div className='relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-fade-in'>
            <h3 className='font-display font-bold text-zinc-900 text-base mb-2'>
              Remove House Number
            </h3>
            <p className='text-sm text-zinc-600 mb-5'>
              Are you sure you want to remove{" "}
              <span className='font-semibold font-mono text-zinc-900'>
                {deleteConfirm.houseNumber}
              </span>{" "}
              from the estate? This cannot be undone.
              {ADMIN_HOUSES.includes(deleteConfirm.houseNumber) && (
                <span className='block mt-2 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-xs'>
                  Warning — this is an admin house. Removing it will not revoke
                  admin access until the admin list in estateConfig.js is also
                  updated.
                </span>
              )}
            </p>
            <div className='flex gap-2'>
              <Button
                variant='secondary'
                size='md'
                className='flex-1 justify-center'
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant='danger'
                size='md'
                className='flex-1 justify-center'
                loading={deleteLoading}
                onClick={() => handleDelete(deleteConfirm)}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
