import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useTeamStore, useProjectStore, useTaskStore, useActivityStore, useIdeaStore } from '../store';

let _syncing = false;
const _loaded = new Set<string>();

function stripBase64(data: unknown): unknown {
  if (!Array.isArray(data)) return data;
  return data.map((item: Record<string, unknown>) => {
    if (!item?.attachments || !Array.isArray(item.attachments)) return item;
    return {
      ...item,
      attachments: (item.attachments as Record<string, unknown>[]).map((att) =>
        typeof att.url === 'string' && att.url.startsWith('data:')
          ? { ...att, url: '' }
          : att
      ),
    };
  });
}

async function push(key: string, data: unknown) {
  if (_syncing || !_loaded.has(key)) return;
  const payload = key === 'ideas' ? stripBase64(data) : data;
  try {
    await setDoc(doc(db, 'teamdash', key), { json: JSON.stringify(payload), ts: Date.now() });
  } catch (e) {
    console.error(`[Firestore] push error (${key}):`, e);
  }
}

const COLLECTIONS = [
  {
    key: 'members',
    get: () => useTeamStore.getState().members,
    set: (d: any) => useTeamStore.getState().setMembers(d),
    sub: (fn: (d: any) => void) => useTeamStore.subscribe((s) => fn(s.members)),
  },
  {
    key: 'projects',
    get: () => useProjectStore.getState().projects,
    set: (d: any) => useProjectStore.getState().setProjects(d),
    sub: (fn: (d: any) => void) => useProjectStore.subscribe((s) => fn(s.projects)),
  },
  {
    key: 'tasks',
    get: () => useTaskStore.getState().tasks,
    set: (d: any) => useTaskStore.getState().setTasks(d),
    sub: (fn: (d: any) => void) => useTaskStore.subscribe((s) => fn(s.tasks)),
  },
  {
    key: 'activities',
    get: () => useActivityStore.getState().activities,
    set: (d: any) => useActivityStore.getState().setActivities(d),
    sub: (fn: (d: any) => void) => useActivityStore.subscribe((s) => fn(s.activities)),
  },
  {
    key: 'ideas',
    get: () => useIdeaStore.getState().ideas,
    set: (d: any) => useIdeaStore.getState().setIdeas(d),
    sub: (fn: (d: any) => void) => useIdeaStore.subscribe((s) => fn(s.ideas)),
  },
];

export function initFirestoreSync() {
  const unsubs: (() => void)[] = [];

  for (const col of COLLECTIONS) {
    // Real-time listener: Firestore → Local
    unsubs.push(
      onSnapshot(
        doc(db, 'teamdash', col.key),
        (snap) => {
          const first = !_loaded.has(col.key);

          if (snap.exists()) {
            try {
              _syncing = true;
              col.set(JSON.parse(snap.data().json));
            } finally {
              _syncing = false;
            }
          }

          if (first) {
            _loaded.add(col.key);
            // First load & Firestore empty → push local data up
            if (!snap.exists()) {
              const data = col.get();
              if (Array.isArray(data) && data.length > 0) {
                push(col.key, data);
              }
            }
          }
        },
        (error) => {
          console.error(`[Firestore] listener error (${col.key}):`, error);
          _loaded.add(col.key); // Enable local-only mode
        },
      ),
    );

    // Local → Firestore
    unsubs.push(col.sub((data) => push(col.key, data)));
  }

  return () => unsubs.forEach((u) => u());
}
