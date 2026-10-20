import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdmissionFormValues, Student } from '../../types';
import { Modal } from '../common/Modal';
import { AdmissionFormFields, formFromStudent, validateAdmissionForm } from './AdmissionFormFields';

/** Edit an admitted student's details (the admission form fields). Course and batch stay fixed. */
export const EditStudentModal: React.FC<{ student: Student; onClose: () => void; onSaved?: () => void }> = ({ student, onClose, onSaved }) => {
  const { courses, batches, updateStudentForm } = useApp();
  const [values, setValues] = useState<AdmissionFormValues>(() => formFromStudent(student));
  const [error, setError] = useState('');

  const save = () => {
    const err = validateAdmissionForm(values);
    if (err) return setError(err);
    updateStudentForm(student.id, values);
    onSaved?.();
    onClose();
  };

  return (
    <Modal
      title="Edit student details"
      subtitle={`${student.name} · ${student.rollNumber}`}
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {error && <span className="mr-auto text-xs text-rose-600">{error}</span>}
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            Cancel
          </button>
          <button onClick={save} className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500">
            Save changes
          </button>
        </div>
      }
    >
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Course and batch can't be changed here. The student's login username stays the same.</p>
      <AdmissionFormFields
        value={values}
        onChange={p => {
          setValues(v => ({ ...v, ...p }));
          setError('');
        }}
        courses={courses}
        batches={batches}
        batchMode="locked"
      />
    </Modal>
  );
};
