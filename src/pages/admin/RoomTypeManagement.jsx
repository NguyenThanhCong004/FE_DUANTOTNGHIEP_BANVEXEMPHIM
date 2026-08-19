import React, { useEffect, useState } from "react";
import { Card, Table, Badge } from "react-bootstrap";

import { apiFetch } from "../../utils/apiClient";
import { ROOM_TYPES } from "../../constants/apiEndpoints";
import AdminPanelPage from "../../components/admin/AdminPanelPage";

export default function RoomTypeManagement() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch(ROOM_TYPES.LIST);
        const json = await res.json().catch(() => null);
        if (mounted) setRoomTypes(Array.isArray(json?.data) ? json.data : []);
      } catch {
        if (mounted) setRoomTypes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminPanelPage title="Loại phòng chiếu">
      <style>{`
        .rt-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .rt-note {
          font-size: 0.82rem;
          color: #6c757d;
        }
        .rt-table th {
          font-size: 0.78rem;
          text-transform: uppercase;
          color: #6c757d;
          font-weight: 700;
          border-bottom: 2px solid #dee2e6;
        }
        .rt-table td {
          vertical-align: middle;
        }
        .seat-badge {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 8px;
        }
      `}</style>

      <Card className="rt-card">
        <Card.Body className="p-4">
          <p className="rt-note mb-4">
            Danh sách loại phòng được thiết lập sẵn cho hệ thống. Khi thêm phòng chiếu mới,
            chọn đúng loại phòng để hệ thống kiểm tra số ghế khi setup sơ đồ.
          </p>

          {loading ? (
            <div className="py-4 text-center text-muted">Đang tải...</div>
          ) : roomTypes.length === 0 ? (
            <div className="py-4 text-center text-muted">Chưa có dữ liệu loại phòng.</div>
          ) : (
            <Table responsive hover className="rt-table mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên loại phòng</th>
                  <th className="text-center">Ghế thường</th>
                  <th className="text-center">Ghế VIP</th>
                  <th className="text-center">Ghế đôi</th>
                  <th className="text-center">Tổng ghế</th>
                </tr>
              </thead>
              <tbody>
                {roomTypes.map((rt, idx) => {
                  const total = (rt.standardSeatCount ?? 0) + (rt.vipSeatCount ?? 0) + (rt.coupleSeatCount ?? 0);
                  return (
                    <tr key={rt.roomTypeId}>
                      <td className="text-muted">{idx + 1}</td>
                      <td className="fw-semibold">{rt.name}</td>
                      <td className="text-center">
                        <Badge bg="secondary" className="seat-badge">{rt.standardSeatCount}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg="warning" text="dark" className="seat-badge">{rt.vipSeatCount}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg="danger" className="seat-badge">{rt.coupleSeatCount}</Badge>
                      </td>
                      <td className="text-center">
                        <span className="fw-bold">{total}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </AdminPanelPage>
  );
}
