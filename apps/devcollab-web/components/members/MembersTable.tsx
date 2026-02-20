'use client';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

interface Member {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'Admin' | 'Contributor' | 'Viewer';
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface MembersTableProps {
  slug: string;
  initialMembers: Member[];
  currentUserId: string;
}

export default function MembersTable({ slug, initialMembers, currentUserId }: MembersTableProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [roleChanging, setRoleChanging] = useState<string | null>(null); // memberId

  const currentMember = members.find(m => m.userId === currentUserId);
  const isAdmin = currentMember?.role === 'Admin';

  async function handleRoleChange(member: Member, newRole: string) {
    setRoleChanging(member.id);
    const previousRole = member.role;
    // optimistic update
    setMembers(prev => prev.map(m =>
      m.id === member.id ? { ...m, role: newRole as Member['role'] } : m
    ));
    try {
      const res = await fetch(`${API_URL}/workspaces/${slug}/members/${member.userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        // revert on failure
        setMembers(prev => prev.map(m =>
          m.id === member.id ? { ...m, role: previousRole } : m
        ));
      }
    } catch {
      setMembers(prev => prev.map(m =>
        m.id === member.id ? { ...m, role: previousRole } : m
      ));
    } finally {
      setRoleChanging(null);
    }
  }

  async function handleRemove(member: Member) {
    const displayName = member.user.name ?? member.user.email;
    if (!window.confirm(`Are you sure you want to remove ${displayName} from this workspace?`)) return;
    // optimistic removal
    setMembers(prev => prev.filter(m => m.id !== member.id));
    try {
      const res = await fetch(`${API_URL}/workspaces/${slug}/members/${member.userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        // revert — append back (position may change, acceptable for error case)
        setMembers(prev => [...prev, member]);
      }
    } catch {
      setMembers(prev => [...prev, member]);
    }
  }

  async function handleGenerateInvite() {
    setGeneratingInvite(true);
    try {
      const res = await fetch(`${API_URL}/workspaces/${slug}/invite-links`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        // data.token is a UUID — construct join URL using browser's origin (NOT API_URL)
        const joinUrl = `${window.location.origin}/join?token=${data.token}`;
        setInviteUrl(joinUrl);
        setShowInviteModal(true);
      }
    } catch {
      // silent failure — button state resets
    } finally {
      setGeneratingInvite(false);
    }
  }

  async function handleRegenerateInvite() {
    await handleGenerateInvite();
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  };
  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: 600,
    color: '#374151',
    background: '#f9fafb',
  };
  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f3f4f6',
    color: '#374151',
    verticalAlign: 'middle',
  };

  return (
    <div>
      {/* Admin toolbar */}
      {isAdmin && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={handleGenerateInvite}
            disabled={generatingInvite}
            style={{
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: generatingInvite ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {generatingInvite ? 'Generating...' : 'Generate Invite Link'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {members.length === 0 ? (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ marginBottom: '1rem' }}>No members yet.</p>
          {isAdmin && (
            <button
              onClick={handleGenerateInvite}
              disabled={generatingInvite}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: generatingInvite ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Generate Invite Link
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                {isAdmin && <th style={{ ...thStyle, width: '120px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const isChangingThisRole = roleChanging === member.id;
                return (
                  <tr key={member.id}>
                    <td style={tdStyle}>
                      {member.user.name ?? '—'}
                      {isCurrentUser && (
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '11px',
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 500,
                        }}>
                          You
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>{member.user.email}</td>
                    <td style={tdStyle}>
                      {isAdmin && !isCurrentUser ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member, e.target.value)}
                          disabled={isChangingThisRole}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: isChangingThisRole ? 'not-allowed' : 'pointer',
                            opacity: isChangingThisRole ? 0.6 : 1,
                          }}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Contributor">Contributor</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: '13px' }}>{member.role}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={tdStyle}>
                        {/* Remove button: only visible for non-Admin, non-self members */}
                        {!isCurrentUser && member.role !== 'Admin' && (
                          <button
                            onClick={() => handleRemove(member)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: 'transparent',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Link Modal */}
      {showInviteModal && inviteUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '520px',
              width: '90%',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>
              Invite Link
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0.75rem' }}>
              Share this link to invite someone to the workspace. Link expires in 72 hours.
            </p>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1rem',
              alignItems: 'stretch',
            }}>
              <input
                type="text"
                readOnly
                value={inviteUrl}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#374151',
                  background: '#f9fafb',
                }}
              />
              <button
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                Copy
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleRegenerateInvite}
                disabled={generatingInvite}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: generatingInvite ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                }}
              >
                {generatingInvite ? 'Generating...' : 'Regenerate'}
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#111827',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
