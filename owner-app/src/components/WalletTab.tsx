import React, { useEffect, useState } from "react";
import { Student } from "../types";

interface WalletTabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedStudent: Student | null;
  depositAmount: string;
  setDepositAmount: (v: string) => void;
  onSelectStudent: (student: Student | null) => void;
  onDeposit: () => void;
  allStudents: Student[];
}

export default function WalletTab({
  searchQuery,
  setSearchQuery,
  selectedStudent,
  depositAmount,
  setDepositAmount,
  onSelectStudent,
  onDeposit,
  allStudents,
}: WalletTabProps) {
  const [filtered, setFiltered] = useState<Student[]>([]);

  useEffect(() => {
    const list = Array.isArray(allStudents) ? allStudents : [];
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) {
      setFiltered(list);
      return;
    }
    const result = list.filter((s) => {
      const email = (s as any).email || "";
      const prefix = (email.split("@")[0] || "").toLowerCase();
      return prefix.includes(q) || s.name.toLowerCase().includes(q);
    });
    setFiltered(result);
  }, [allStudents, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Wallet / Deposits</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* LEFT COLUMN */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search students (email prefix)
            </label>
            <div className="flex space-x-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. johndoe"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => {}}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Search
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Results</p>
              <div className="max-h-56 overflow-y-auto border rounded-lg p-2">
                {filtered.length === 0 ? (
                  <div className="text-sm text-gray-500">No students found</div>
                ) : (
                  filtered.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => onSelectStudent(s)}
                      className={`p-2 rounded-md cursor-pointer flex items-center justify-between ${
                        selectedStudent?.id === s.id
                          ? "bg-indigo-50 border border-indigo-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-sm text-gray-500">
                          {(s as any).email || "—"}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">
                        ₹{(s.walletBalance || 0).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Selected Student</h4>
            {selectedStudent ? (
              <>
                <div className="mb-2">
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-medium">{selectedStudent.name}</div>
                </div>
                <div className="mb-2">
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">
                    {(selectedStudent as any).email || "—"}
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-sm text-gray-600">Balance</div>
                  <div className="font-medium">
                    ₹{(selectedStudent.walletBalance || 0).toFixed(2)}
                  </div>
                </div>

                <label className="block text-sm text-gray-600 mb-1 mt-3">
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0" // ✅ prevents negative via arrows
                  value={depositAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    // ✅ prevents typing negative numbers
                    if (val === "" || parseFloat(val) >= 0) {
                      setDepositAmount(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    // ✅ prevent typing "-" key
                    if (e.key === "-" || e.key === "e" || e.key === "E") {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />

                <div className="flex space-x-2">
                  <button
                    onClick={onDeposit}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => onSelectStudent(null)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Clear
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">
                Select a student from the list to deposit funds.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
