import React, { useCallback, useEffect, useState } from 'react';



import { useNavigate, useLocation } from 'react-router-dom';



import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { useAdminToast } from '../../components/admin/AdminToast';
import AdminPagination from '../../components/admin/AdminPagination';



import { apiJson, withQuery } from '../../utils/apiClient';



import { STAFF, CINEMAS } from '../../constants/apiEndpoints';

import { isActiveStatus } from '../../utils/statusFormat';

import { apiMessage, MESSAGES } from '../../utils/uiMessages';
import { formatDate } from '../../utils/formatters';

const staffStatusLabel = (value) => (
  isActiveStatus(value) ? 'Đang làm việc' : 'Tạm nghỉ / Khóa'
);







const SystemStaffManagement = () => {



  const navigate = useNavigate();



  const location = useLocation();



  const [currentPage, setCurrentPage] = useState(1);



  const [searchTerm, setSearchTerm] = useState('');



  const [selectedCinemaFilter, setSelectedCinemaFilter] = useState(''); // Thêm state lọc rạp



  const [selectedItem, setSelectedItem] = useState(null);



  const [showModal, setShowModal] = useState(false);



  const [showDeleteModal, setShowDeleteModal] = useState(false);



  const [deletingItem, setDeletingItem] = useState(null);



  const [deleteError, setDeleteError] = useState('');



  const { showToast, ToastComponent } = useAdminToast();



  const itemsPerPage = 5;







  const [allEmployees, setAllEmployees] = useState([]);



  const [cinemas, setCinemas] = useState([]);



  const [loading, setLoading] = useState(true);







  useEffect(() => {



    if (location.state?.message) {



      showToast(location.state.message, location.state.type || 'success');



      window.history.replaceState({}, document.title);






    }



  }, [location.state, showToast]);







  const fetchInitialData = useCallback(async () => {



    setLoading(true);



    try {



      const [staffRes, cinemaRes] = await Promise.all([



        apiJson(withQuery(STAFF.SUPER_ADMIN_VIEW, { search: searchTerm })),



        apiJson(CINEMAS.LIST)



      ]);







      if (cinemaRes.ok) setCinemas(cinemaRes.data || []);



      if (staffRes.ok) {



        const list = staffRes.data || [];



        setAllEmployees(



          list.map((s) => ({



            id: s.staffId ?? s.id,



            name: s.fullname || s.username || "—",



            email: s.email || "—",



            phone: s.phone || "—",



            role: String(s.role || "").replace(/^ROLE_/i, "").toUpperCase(),



            status: s.status,



            cinemaId: s.cinemaId,



            avatar: s.avatar,



            birthday: s.birthday



          }))



        );



      }



    } catch (error) {



      console.error("Error fetching data:", error);



    } finally {



      setLoading(false);



    }



  }, [searchTerm]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);







  const getCinemaName = (cid) => {



    if (!cid) return "Chưa gán rạp";



    const cinema = cinemas.find(c => String(c.cinemaId || c.id) === String(cid));



    return cinema ? cinema.name : `Rạp #${cid}`;



  };







  // Logic lọc nâng cao (Tìm kiếm + Theo rạp)



  const filteredEmployees = allEmployees.filter(emp => {



    const matchesCinema = selectedCinemaFilter === '' || String(emp.cinemaId) === String(selectedCinemaFilter);



    



    return matchesCinema;



  });







  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    // 1. Ưu tiên ADMIN lên đầu
    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;

    // 2. Cùng role thì ai mới hơn (ID lớn hơn) lên trước
    return (b.id || 0) - (a.id || 0);
  });







  const currentItems = sortedEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);







  const handleDelete = async (emp) => {



    try {



      const res = await apiJson(STAFF.BY_ID(emp.id), { method: 'DELETE' });



      if (res.ok) {



        setAllEmployees(prev => prev.filter(e => e.id !== emp.id));



        setShowDeleteModal(false);



        setDeletingItem(null);



        setDeleteError('');



        showToast('Xóa nhân sự thành công');



      } else {



        setDeleteError(apiMessage(res, MESSAGES.deleteFailed));



      }



    } catch {



      setDeleteError(MESSAGES.networkError);



    }



  };







  return (



    <AdminPanelPage



      icon="people-fill"



      title="Quản lý nhân sự toàn hệ thống"



      description="Danh sách tất cả nhân sự (ADMIN & STAFF) từ mọi chi nhánh trên toàn quốc."



      headerRight={



        <button 



          type="button"



          className="admin-btn"



          style={{ background: 'white', color: '#6366f1' }} 



          onClick={() => navigate('/super-admin/system-staff/create')}>



          <i className="bi bi-person-plus me-2"></i> Thêm nhân sự



        </button>



      }



    >



      <div className="admin-table-container p-4">



        {/* Thanh công cụ: Tìm kiếm + Lọc rạp */}



        <div className="d-flex flex-wrap gap-3 mb-4">



          <div className="admin-search-wrapper" style={{ flex: '1', minWidth: '300px' }}>



            <i className="bi bi-search admin-search-icon"></i>



            <input 



              type="text" className="admin-search-input" placeholder="Tìm tên, email, vai trò..." 



              value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}



            />



          </div>



          



          <div className="admin-search-wrapper" style={{ width: '250px' }}>



            <i className="bi bi-filter admin-search-icon"></i>



            <select 



              className="admin-search-input ps-5" 



              value={selectedCinemaFilter} 



              onChange={(e) => { setSelectedCinemaFilter(e.target.value); setCurrentPage(1); }}



            >



              <option value="">Tất cả các rạp</option>



              {cinemas.map(c => (



                <option key={c.cinemaId || c.id} value={c.cinemaId || c.id}>{c.name}</option>



              ))}



            </select>



          </div>



        </div>







        {loading ? (



          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>



        ) : (



          <>



            <div className="table-responsive">



              <table className="admin-table">



                <thead>



                  <tr>



                    <th style={{ width: '60px' }}>STT</th>



                    <th>Nhân viên</th>



                    <th>Vai trò</th>



                    <th>Rạp làm việc</th>



                    <th>Trạng thái</th>



                    <th className="text-center">Thao tác</th>



                  </tr>



                </thead>



                <tbody>



                  {currentItems.map((emp, index) => (



                    <tr key={emp.id}>



                      <td className="text-muted small">



                        {(currentPage - 1) * itemsPerPage + index + 1}



                      </td>



                      <td>



                        <div className="d-flex align-items-center gap-2">



                          <div className="bg-light rounded-circle overflow-hidden d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', border: '1px solid #eee' }}>



                            {emp.avatar ? <img src={emp.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="bi bi-person text-muted"></i>}



                          </div>



                          <div>



                            <div className="fw-semibold">{emp.name}</div>



                            <small className="text-muted">{emp.email}</small>



                          </div>



                        </div>



                      </td>



                      <td>



                        <span className={`admin-badge ${emp.role === 'ADMIN' ? 'admin-badge-primary' : 'admin-badge-info'}`}>



                          {emp.role === 'ADMIN' ? 'Quản lý' : 'Nhân viên'}



                        </span>



                      </td>



                      <td><span className="small text-muted">{getCinemaName(emp.cinemaId)}</span></td>



                      <td>



                        <span className={`admin-badge ${isActiveStatus(emp.status) ? 'admin-badge-success' : 'admin-badge-danger'}`}>



                          {staffStatusLabel(emp.status)}



                        </span>



                      </td>



                      <td className="text-center">



                        <div className="d-flex justify-content-center gap-2">



                          <button className="admin-btn admin-btn-sm admin-btn-outline" title="Xem chi tiết" onClick={() => { setSelectedItem(emp); setShowModal(true); }}>



                            <i className="bi bi-eye"></i>



                          </button>



                          <button className="admin-btn admin-btn-sm admin-btn-primary" title="Sửa" onClick={() => navigate(`/super-admin/system-staff/edit/${emp.id}`)}>



                            <i className="bi bi-pencil"></i>



                          </button>



                          <button className="admin-btn admin-btn-sm admin-btn-danger" title="Xóa" onClick={() => { setDeletingItem(emp); setDeleteError(''); setShowDeleteModal(true); }}>



                            <i className="bi bi-trash"></i>



                          </button>



                        </div>



                      </td>



                    </tr>



                  ))}



                </tbody>



              </table>



            </div>







            {/* Phân trang */}



            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedEmployees.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="nhân viên"
            />



          </>



        )}



      </div>







      {/* Modal chi tiết */}



      {showModal && selectedItem && (



        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>



          <div className="admin-modal" onClick={e => e.stopPropagation()}>



            <div className="admin-modal-header">



              <h3>Chi tiết nhân sự</h3>



              <button className="admin-modal-close" onClick={() => setShowModal(false)}><i className="bi bi-x-lg"></i></button>



            </div>



            <div className="admin-modal-body">



              <div className="row">



                <div className="col-md-4 text-center">



                  <div className="bg-light rounded-4 p-4 mb-3 d-flex align-items-center justify-content-center overflow-hidden" style={{ height: '150px' }}>



                    {selectedItem.avatar ? <img src={selectedItem.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="bi bi-person-circle" style={{ fontSize: '5rem', color: '#ccc' }}></i>}



                  </div>



                </div>



                <div className="col-md-8">



                  <h4 className="fw-bold">{selectedItem.name}</h4>



                  <p className="mb-1"><strong>Email:</strong> {selectedItem.email}</p>



                  <p className="mb-1"><strong>SĐT:</strong> {selectedItem.phone}</p>



                  <p className="mb-1"><strong>Ngày sinh:</strong> {formatDate(selectedItem.birthday, { fallback: '—' })}</p>



                  <p className="mb-1"><strong>Vai trò:</strong> {selectedItem.role}</p>



                  <p className="mb-1"><strong>Trạng thái:</strong> {staffStatusLabel(selectedItem.status)}</p>



                  <p className="mb-0"><strong>Rạp:</strong> {getCinemaName(selectedItem.cinemaId)}</p>



                </div>



              </div>



            </div>



            <div className="admin-modal-footer">



              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Đóng</button>



            </div>



          </div>



        </div>



      )}







      {/* Modal xác nhận xóa */}



      {showDeleteModal && deletingItem && (



        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>



          <div className="admin-modal" onClick={e => e.stopPropagation()}>



            <div className="admin-modal-header">



              <h3>Xác nhận xóa</h3>



              <button className="admin-modal-close" onClick={() => setShowDeleteModal(false)}><i className="bi bi-x-lg"></i></button>



            </div>



            <div className="admin-modal-body">



              <p>Bạn có chắc chắn muốn xóa nhân sự <strong>{deletingItem.name}</strong>?</p>



              {deleteError && (



                <div className="alert alert-danger mb-3">



                  <i className="bi bi-exclamation-triangle me-2"></i>



                  {deleteError}



                </div>



              )}



              <p className="text-danger small">Hành động này không thể khôi phục.</p>



            </div>



            <div className="admin-modal-footer">



              <button className="admin-btn admin-btn-outline" onClick={() => setShowDeleteModal(false)}>Hủy</button>



              <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(deletingItem)}>Xóa vĩnh viễn</button>



            </div>



          </div>



        </div>



      )}



      <ToastComponent />



    </AdminPanelPage>



  );



};







export default SystemStaffManagement;



