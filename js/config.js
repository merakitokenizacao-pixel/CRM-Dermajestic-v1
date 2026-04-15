/* ══════════════════════════════════════
   DermajestiC CRM — Config & Globals
   ══════════════════════════════════════ */

// ── Supabase ──
const SUPABASE_URL = 'https://gzylkzrgesuhjhpvvovi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWxrenJnZXN1aGpocHZ2b3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTgxMjcsImV4cCI6MjA4OTMzNDEyN30.64z_vMZ8QpziQe8w8rCHGW7hoz9IXAfZovGnz5YX-i8';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Estado global ──
let allLeads        = [];
let allAgendamentos = [];
let allConversas    = [];

// ── Filtros ativos ──
let currentDashFilter      = 'hoje';
let currentLeadsFilter     = 'hoje';
let currentAgendDateFilter = 'hoje';

// ── Calendário ──
let calYear, calMonth, selectedCalDate;

// ── Charts ──
let svcChart      = null;
let timelineChart = null;

// ── Serviços disponíveis ──
const SERVICOS = [
  'Limpeza de pele',
  'Botox',
  'Peeling',
  'Drenagem linfática',
  'Preenchimento',
  'Microagulhamento',
  'Depilação a laser',
  'Hidratação facial',
  'Radiofrequência',
  'Criolipólise',
  'Outro',
];
