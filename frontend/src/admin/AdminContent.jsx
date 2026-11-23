import { api, img, fmtDate } from '../api'
import { useApp } from '../ctx'
import { useLoad, Table, useAct } from './util'

// FORMAT DATE
const D = (t) => fmtDate((t || '').slice(0, 10))


/* =========================================
   GALLERY MANAGEMENT
========================================= */

export function Gallery() {
    const { toast } = useApp()

    const [c, reload] = useLoad('/admin/content')
    const [ms] = useLoad('/admin/memorials')

    const act = useAct(reload)

    if (!c || !ms) {
        return <p>Loading gallery...</p>
    }

    const upload = async (e) => {
        e.preventDefault()

        const form = e.currentTarget
        const fd = new FormData(form)

        const id = fd.get('memorial')

        if (!id) {
            toast('Please select a memorial.')
            return
        }

        fd.delete('memorial')

        try {
            const r = await api.upload(
                `/memorials/${id}/gallery`,
                fd
            )

            toast(`${r.uploaded} photo(s) uploaded.`)

            form.reset()
            reload()

        } catch (er) {
            toast(er.message)
        }
    }

    return (
        <>
            {/* UPLOAD FORM */}
            <form
                onSubmit={upload}
                className="two"
                style={{ maxWidth: 620 }}
            >
                <div>
                    <label>Memorial</label>

                    <select name="memorial" required>
                        {ms.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Album</label>

                    <select name="album">
                        {['Wake', 'Funeral', 'Burial', 'Family'].map((a) => (
                            <option key={a} value={a}>
                                {a}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Caption</label>
                    <input name="caption" />
                </div>

                <div>
                    <label>Photos</label>

                    <input
                        type="file"
                        name="photos[]"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        required
                    />
                </div>

                <p>
                    <button className="btn" type="submit">
                        Upload photos
                    </button>
                </p>
            </form>

            {/* GALLERY PHOTOS */}
            <div className="gal">
                {c.gallery.map((g) => (
                    <figure
                        key={g.id}
                        style={{ margin: 0 }}
                    >
                        <img
                            src={img(g.file)}
                            alt={g.caption || 'Memorial gallery photo'}
                        />

                        <small>
                            {g.memorial}: {g.album}
                            {g.caption && `, ${g.caption}`}
                        </small>

                        <br />

                        <button
                            className="btn s d"
                            onClick={() =>
                                act(
                                    () => api.del('/gallery/' + g.id),
                                    'Photo removed.',
                                    'Remove this photo?'
                                )
                            }
                        >
                            Remove
                        </button>
                    </figure>
                ))}
            </div>

            {c.gallery.length === 0 && (
                <p>No gallery photos yet.</p>
            )}
        </>
    )
}


/* =========================================
   MEMORY WALL
========================================= */

export function MemoryWall() {
    const [c, reload] = useLoad('/admin/content')

    const act = useAct(reload)

    if (!c) {
        return <p>Loading memories...</p>
    }

    return (
        <Table
            heads={[
                'Memorial',
                'From',
                'Memory',
                'Status',
                ''
            ]}
        >
            {(c.memories || []).map((x) => (
                <tr key={x.id}>
                    <td>{x.memorial}</td>

                    <td>{x.name}</td>

                    <td>
                        {x.story}

                        {x.photo && (
                            <img
                                src={img(x.photo)}
                                alt="Memory attachment"
                                width="50"
                                style={{ display: 'block' }}
                            />
                        )}
                    </td>

                    <td>{x.status}</td>

                    <td>
                        {x.status !== 'approved' && (
                            <button
                                className="btn s"
                                onClick={() =>
                                    act(
                                        () => api.put(
                                            '/memories/' + x.id,
                                            { status: 'approved' }
                                        ),
                                        'Memory approved.'
                                    )
                                }
                            >
                                Approve
                            </button>
                        )}

                        {' '}

                        {x.status === 'pending' && (
                            <button
                                className="btn s o"
                                onClick={() =>
                                    act(
                                        () => api.put(
                                            '/memories/' + x.id,
                                            { status: 'rejected' }
                                        ),
                                        'Memory rejected.'
                                    )
                                }
                            >
                                Reject
                            </button>
                        )}

                        {' '}

                        <button
                            className="btn s d"
                            onClick={() =>
                                act(
                                    () => api.del('/memories/' + x.id),
                                    'Deleted.',
                                    'Delete this memory?'
                                )
                            }
                        >
                            Delete
                        </button>
                    </td>
                </tr>
            ))}
        </Table>
    )
}


/* =========================================
   PRAYERS AND CANDLES
========================================= */

export function PrayersCandles() {
    const [c, reload] = useLoad('/admin/content')

    const act = useAct(reload)

    if (!c) {
        return <p>Loading prayers and candles...</p>
    }

    const del = (type, id) => (
        <button
            className="btn s d"
            onClick={() =>
                act(
                    () => api.del(`/${type}/${id}`),
                    'Deleted.',
                    'Delete this tribute?'
                )
            }
        >
            Delete
        </button>
    )

    const rows = [
        ...(c.candles || []).map((x) => (
            <tr key={'c' + x.id}>
                <td>Candle</td>
                <td>{x.memorial}</td>
                <td>{x.name}</td>
                <td>{x.message}</td>
                <td>{del('candles', x.id)}</td>
            </tr>
        )),

        ...(c.prayers || []).map((x) => (
            <tr key={'p' + x.id}>
                <td>{x.type}</td>
                <td>{x.memorial}</td>
                <td>{x.name}</td>
                <td>{x.message}</td>
                <td>{del('prayers', x.id)}</td>
            </tr>
        ))
    ]

    return (
        <Table
            heads={[
                'Type',
                'Memorial',
                'From',
                'Message',
                ''
            ]}
        >
            {rows}
        </Table>
    )
}


/* =========================================
   GUEST MANAGEMENT
========================================= */

export function Guests() {
    const [c, reload] = useLoad('/admin/content')

    const act = useAct(reload)

    if (!c) {
        return <p>Loading guest submissions...</p>
    }

    const rows = [
        ...(c.messages || []).map((x) => ({
            k: 'm' + x.id,
            t: x.created_at,
            type: 'Message',
            from: `${x.name} <${x.email}>`,
            text: x.message,
            del: () => api.del('/messages/' + x.id)
        })),

        ...(c.memories || []).map((x) => ({
            k: 'y' + x.id,
            t: x.created_at,
            type: `Memory (${x.status})`,
            from: x.name,
            text: x.story,
            del: () => api.del('/memories/' + x.id)
        })),

        ...(c.prayers || []).map((x) => ({
            k: 'p' + x.id,
            t: x.created_at,
            type: x.type,
            from: x.name,
            text: x.message,
            del: () => api.del('/prayers/' + x.id)
        })),

        ...(c.candles || []).map((x) => ({
            k: 'c' + x.id,
            t: x.created_at,
            type: 'Candle',
            from: x.name,
            text: x.message,
            del: () => api.del('/candles/' + x.id)
        }))
    ].sort((a, b) =>
        (b.t || '').localeCompare(a.t || '')
    )

    return (
        <Table
            heads={[
                'Date',
                'Type',
                'From',
                'Content',
                ''
            ]}
        >
            {rows.map((r) => (
                <tr key={r.k}>
                    <td>{D(r.t)}</td>

                    <td>{r.type}</td>

                    <td>{r.from}</td>

                    <td>{r.text}</td>

                    <td>
                        <button
                            className="btn s d"
                            onClick={() =>
                                act(
                                    r.del,
                                    'Deleted.',
                                    'Delete this submission?'
                                )
                            }
                        >
                            Delete
                        </button>
                    </td>
                </tr>
            ))}
        </Table>
    )
}
