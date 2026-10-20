import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { SupportTicket } from '../../types';
import {
  LifeBuoy,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  User,
  ShieldCheck,
  Bot,
  X
} from 'lucide-react';

export const SupportTickets: React.FC = () => {
  const {
    tickets,
    createSupportTicket,
    replyToTicket,
    updateTicketStatus,
    currentUser,
    role
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // New ticket state
  const [category, setCategory] = useState<SupportTicket['category']>('Test Evaluation');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');

  // Students and counselors see their own tickets; faculty also see test-evaluation queries; office/management see all.
  const scopedTickets = tickets.filter(t => {
    if (role === 'management' || role === 'office_staff') return true;
    if (t.studentOrStaffId === currentUser.id) return true;
    return role === 'faculty' && t.category === 'Test Evaluation';
  });

  const filteredTickets = scopedTickets.filter(t => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    const newT = createSupportTicket({
      studentOrStaffId: currentUser.id,
      userName: currentUser.name,
      userRole: role,
      category,
      subject,
      description,
      priority
    });

    // Provide instant automated help desk reply
    setTimeout(() => {
      let automatedReply = 'VRM Automated Help Desk: Your ticket has been registered. Our academic desk will review your query within 4 business hours.';
      if (category === 'Fee & Invoicing') {
        automatedReply = 'VRM Finance Bot: Payment query acknowledged. If you made a transaction within the last 15 minutes, please note bank reconciliations take up to 30 mins to reflect on the portal.';
      } else if (category === 'Test Evaluation') {
        automatedReply = 'VRM Academic Bot: Evaluation query routed directly to the subject evaluation mentor. Check your notifications for slot allotment.';
      }
      replyToTicket(newT.id, automatedReply, true, 'VRM HelpDesk AI');
    }, 800);

    setIsNewTicketOpen(false);
    setSubject('');
    setDescription('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    const isStaff = role !== 'student';
    replyToTicket(selectedTicket.id, replyText, isStaff, currentUser.name);
    setReplyText('');

    // Update active selection
    const updated = tickets.find(t => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Integrated Support & Help Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Troubleshooting tickets · Automated help desk responses · Mentor query resolution
          </p>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ID, candidate, topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg shrink-0">
          {[
            { id: 'all', label: 'All Tickets' },
            { id: 'open', label: 'Open' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'resolved', label: 'Resolved' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.map(ticket => {
          const isSelected = selectedTicket?.id === ticket.id;
          return (
            <div
              key={ticket.id}
              className={`bg-white border rounded-xl p-5 shadow-2xs transition-colors cursor-pointer ${
                isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {ticket.ticketNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {ticket.category}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">From {ticket.userName}</span>
                </div>

                <div className="flex items-center gap-2">
                  {ticket.status === 'resolved' ? (
                    <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolved</span>
                    </span>
                  ) : ticket.status === 'in_progress' ? (
                    <span className="text-amber-800 font-semibold text-xs flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>In Progress</span>
                    </span>
                  ) : (
                    <span className="text-rose-700 font-semibold text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Open
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono">{ticket.createdAt}</span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mt-2">{ticket.subject}</h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ticket.description}</p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  {ticket.messages.length} message{ticket.messages.length === 1 ? '' : 's'} exchanged
                </span>
                <span className="font-semibold text-amber-800 hover:underline">
                  {isSelected ? 'Viewing Discussion' : 'Open Ticket Thread →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Thread Drawer / Modal */}
      {selectedTicket && (
        <Modal title={<>{selectedTicket.subject}</>} subtitle={`${selectedTicket.ticketNumber} · ${selectedTicket.category}`} onClose={() => setSelectedTicket(null)} size="lg" bodyClassName="px-5 py-4 space-y-4">

        {/* Status change toolbar for staff/admin */}
        {role !== 'student' && (
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-medium text-slate-700">Update Ticket Lifecycle:</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateTicketStatus(selectedTicket.id, 'in_progress');
                  setSelectedTicket({ ...selectedTicket, status: 'in_progress' });
                }}
                className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => {
                  updateTicketStatus(selectedTicket.id, 'resolved');
                  setSelectedTicket({ ...selectedTicket, status: 'resolved' });
                }}
                className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-semibold hover:bg-emerald-200"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        )}

        {/* Conversation Log */}
        <div className="space-y-3 max-h-72 overflow-y-auto p-1">
          {selectedTicket.messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl text-xs space-y-1 ${
                msg.isStaff
                  ? 'bg-amber-50/70 border border-amber-200 text-slate-800 mr-6'
                  : 'bg-slate-100 border border-slate-200 text-slate-900 ml-6'
              }`}
            >
              <div className="flex justify-between font-semibold text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  {msg.isStaff && <Bot className="w-3.5 h-3.5 text-amber-600" />}
                  <span>{msg.sender}</span>
                </span>
                <span className="font-mono text-slate-400">{msg.timestamp}</span>
              </div>
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Reply Input Box */}
        <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            placeholder="Type your response or update..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
        </form>
        </Modal>
      )}

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <Modal title="Raise Support Ticket" onClose={() => setIsNewTicketOpen(false)} size="md" bodyClassName="px-5 py-4 space-y-4">

        <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Issue Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="Test Evaluation">Test Evaluation & Mentor Feedback</option>
              <option value="Fee & Invoicing">Fee & Invoicing Ledger</option>
              <option value="Portal Login">Portal Login & Credentials</option>
              <option value="Classroom & Batch">Classroom Timetable & Batch Change</option>
              <option value="Material Access">Study Material Access</option>
              <option value="Other">Other Query</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject Title *</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Summary of your issue..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Details *</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your issue in detail..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewTicketOpen(false)}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              Submit to Help Desk
            </button>
          </div>
        </form>
        </Modal>
      )}

    </div>
  );
};
