import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Form, Button, Row, Col, Card, Badge, InputGroup, Alert } from "react-bootstrap";
import {
  ArrowLeft,
  Film,
  Calendar,
  Percent,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { getStoredStaff } from "../../../utils/authStorage";
import { apiFetch } from "../../../utils/apiClient";
import { MOVIES, PROMOTIONS } from "../../../constants/apiEndpoints";
import { useSuperAdminCinema } from "../../../components/layout/useSuperAdminCinema";

export default function AdminPromotionForm({ mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";

  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const searchParams = new URLSearchParams(location.search);
  const defaultStart = searchParams.get("startDate") || "";
  const defaultEnd = searchParams.get("endDate") || defaultStart;

  const staff = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const cinemaId = location.pathname.startsWith("/super-admin")
    ? selectedCinemaId
    : staff?.cinemaId ?? null;

  const [movies, setMovies] = useState([]);

  const initialData = useMemo(
    () => ({
      title: "",
      discount_percent: "",
      start_date: defaultStart,
      end_date: defaultEnd,
      selectedMovieIds: [],
      description: "",
    }),
    [defaultEnd, defaultStart]
  );

  const [formData, setFormData] = useState(initialData);
  const [initialFormData, setInitialFormData] = useState(initialData); // dùng cho check "chưa đổi"
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (isEdit && errors.form) setErrors((prev) => ({ ...prev, form: "" }));
  };

  const toggleMovieSelection = (movieId) => {
    setFormData((prev) => {
      const isSelected = prev.selectedMovieIds.includes(movieId);
      const nextSelected = isSelected
        ? prev.selectedMovieIds.filter((id2) => id2 !== movieId)
        : [...prev.selectedMovieIds, movieId];

      return { ...prev, selectedMovieIds: nextSelected };
    });

    if (errors.movies) setErrors((prev) => ({ ...prev, movies: "" }));
  };

  const selectAllMovies = () => {
    setFormData((prev) => {
      const allIds = movies.map((m) => m.id);
      const isAllSelected = prev.selectedMovieIds.length === allIds.length;
      return { ...prev, selectedMovieIds: isAllSelected ? [] : allIds };
    });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mr = await apiFetch(MOVIES.LIST);
        const mj = await mr.json().catch(() => null);
        const moviesList = Array.isArray(mj?.data) ? mj.data : [];
        if (mounted) {
          setMovies(
            moviesList.map((m) => ({
              id: m.id,
              title: m.title,
              genre: m.genre,
              duration: m.duration,
            }))
          );
        }

        if (!isEdit) {
          if (mounted) setLoading(false);
          return;
        }

        const pr = await apiFetch(PROMOTIONS.BY_ID(id));
        const pj = await pr.json().catch(() => null);
        const promoData = pj?.data ?? pj;
        if (!mounted) return;
        if (!pr.ok || !promoData) {
          setErrors({ form: pj?.message || "Không tải được khuyến mãi" });
          setLoading(false);
          return;
        }

        const next = {
          title: promoData.title ?? "",
          discount_percent:
            promoData.discount_percent != null ? String(promoData.discount_percent) : "",
          start_date: promoData.startDate ?? promoData.start_date ?? "",
          end_date: promoData.endDate ?? promoData.end_date ?? "",
          selectedMovieIds: promoData.selectedMovieIds ?? [],
          description: promoData.description ?? "",
        };
        setFormData(next);
        setInitialFormData(next);
      } catch {
        if (mounted) setErrors({ form: "Lỗi tải dữ liệu" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (isEdit) {
      const isUnchanged = JSON.stringify(formData) === JSON.stringify(initialFormData);
      if (isUnchanged) newErrors.form = "Bạn chưa thay đổi thông tin nào.";
    }

    if (!formData.title) newErrors.title = "Tên khuyến mãi không được để trống";
    if (
      !formData.discount_percent ||
      Number(formData.discount_percent) <= 0 ||
      Number(formData.discount_percent) > 100
    ) {
      newErrors.discount_percent = "Phần trăm giảm giá từ 1-100%";
    }
    if (!formData.start_date) newErrors.start_date = "Chọn ngày bắt đầu";
    if (!formData.end_date) newErrors.end_date = "Chọn ngày kết thúc";
    if (formData.selectedMovieIds.length === 0) newErrors.movies = "Vui lòng chọn ít nhất 1 phim";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (cinemaId == null) {
      setErrors({ form: "Vui lòng chọn rạp (Super Admin) hoặc đăng nhập tài khoản có cinemaId." });
      return;
    }

    const body = {
      title: formData.title,
      discount_percent: Number(formData.discount_percent),
      start_date: formData.start_date,
      end_date: formData.end_date,
      selectedMovieIds: formData.selectedMovieIds,
      description: formData.description || "",
      cinemaId,
    };

    (async () => {
      try {
        const url = isEdit ? PROMOTIONS.BY_ID(id) : PROMOTIONS.LIST;
        const res = await apiFetch(url, {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setErrors({ form: json?.message || "Lưu khuyến mãi thất bại" });
          return;
        }
        navigate(`${prefix}/promotions`);
      } catch {
        setErrors({ form: "Không thể kết nối server" });
      }
    })();
  };

  if (loading) {
    return (
      <div className="add-promotion-page text-dark">
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div className={`${isEdit ? "edit-promotion-page" : "add-promotion-page"} text-dark pb-5`}>
      <style>{`
        .promo-input {
          border-radius: 10px !important;
          border: 1.5px solid #eee !important;
          padding: 10px 15px !important;
          color: #000 !important;
        }
        .promo-input::placeholder {
          color: #000 !important;
          opacity: 0.6;
        }
        .movie-badge-item {
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #eee;
          user-select: none;
        }
        .movie-badge-item.selected {
          background-color: #0d6efd !important;
          color: white !important;
          border-color: #0d6efd;
          transform: scale(1.05);
        }
        .movie-list-container {
          max-height: 250px;
          overflow-y: auto;
          border: 1.5px solid #eee;
          border-radius: 12px;
          padding: 15px;
        }
      `}</style>

      <div className="d-flex align-items-center gap-3 mb-4">
        <Button
          variant="light"
          className="rounded-circle p-2 shadow-sm"
          onClick={() => navigate(`${prefix}/promotions`)}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h3 className="mb-0 fw-bold">
            {isEdit ? `Chỉnh sửa khuyến mãi #${id}` : "Tạo khuyến mãi đa phim"}
          </h3>
          <p className="text-muted small mb-0">
            {isEdit
              ? "Cập nhật mức giảm giá và danh sách phim áp dụng"
              : "Thiết lập mức giảm giá cho một hoặc nhiều bộ phim cùng lúc"}
          </p>
        </div>
      </div>

      {isEdit && errors.form ? (
        <Alert
          variant="warning"
          className="border-0 shadow-sm mb-4 d-flex align-items-center gap-2"
          style={{ borderRadius: "15px" }}
        >
          <AlertTriangle size={20} />
          <span className="fw-bold">{errors.form}</span>
        </Alert>
      ) : null}

      <Form onSubmit={handleSubmit}>
        <Row className="justify-content-center">
          <Col lg={11}>
            <Card className="border-0 shadow-sm p-4 rounded-4">
              <Row>
                <Col md={5} className="border-end pe-md-4">
                  <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                    <Info size={20} />
                    <h5 className="fw-bold mb-0">Thông tin ưu đãi</h5>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Tên chương trình</Form.Label>
                    <Form.Control
                      name="title"
                      placeholder="VD: Ưu đãi phim tháng 3"
                      className={`promo-input ${errors.title ? "is-invalid" : ""}`}
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                    {errors.title ? <div className="text-danger small mt-1">{errors.title}</div> : null}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted">Phần trăm điều chỉnh (%)</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        name="discount_percent"
                        placeholder="VD: 20 hoặc -10"
                        className={`promo-input ${errors.discount_percent ? "is-invalid" : ""}`}
                        value={formData.discount_percent}
                        onChange={handleInputChange}
                      />
                      <InputGroup.Text className="bg-light border-start-0 rounded-end-3">
                        <Percent size={16} />
                      </InputGroup.Text>
                    </InputGroup>
                    {errors.discount_percent ? (
                      <div className="text-danger small mt-1">{errors.discount_percent}</div>
                    ) : null}
                  </Form.Group>

                  <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                    <Calendar size={20} />
                    <h5 className="fw-bold mb-0">Thời hạn áp dụng</h5>
                  </div>

                  <Row className="g-2 mb-4">
                    <Col>
                      <Form.Label className="small fw-bold text-muted">Từ ngày</Form.Label>
                      <Form.Control
                        type="date"
                        name="start_date"
                        className={`promo-input ${errors.start_date ? "is-invalid" : ""}`}
                        value={formData.start_date}
                        onChange={handleInputChange}
                      />
                      {errors.start_date ? (
                        <div className="text-danger small mt-1">{errors.start_date}</div>
                      ) : null}
                    </Col>
                    <Col>
                      <Form.Label className="small fw-bold text-muted">Đến ngày</Form.Label>
                      <Form.Control
                        type="date"
                        name="end_date"
                        className={`promo-input ${errors.end_date ? "is-invalid" : ""}`}
                        value={formData.end_date}
                        onChange={handleInputChange}
                      />
                      {errors.end_date ? <div className="text-danger small mt-1">{errors.end_date}</div> : null}
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Mô tả (Không bắt buộc)</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      rows={2}
                      className="promo-input"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={7} className="ps-md-4 mt-4 mt-md-0">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2 text-primary">
                      <Film size={20} />
                      <h5 className="fw-bold mb-0">Chọn phim áp dụng</h5>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-decoration-none fw-bold"
                      onClick={selectAllMovies}
                    >
                      {formData.selectedMovieIds.length === movies.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </Button>
                  </div>

                  <div className={`movie-list-container ${errors.movies ? "border-danger" : ""}`}>
                    <div className="d-flex flex-wrap gap-2">
                      {movies.map((movie) => {
                        const selected = formData.selectedMovieIds.includes(movie.id);
                        return (
                          <Badge
                            key={movie.id}
                            bg="light"
                            text="dark"
                            className={`movie-badge-item px-3 py-2 rounded-pill fw-normal d-flex align-items-center gap-2 ${
                              selected ? "selected" : ""
                            }`}
                            onClick={() => toggleMovieSelection(movie.id)}
                          >
                            {selected ? <CheckCircle2 size={14} /> : null}
                            {movie.title}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {errors.movies ? <div className="text-danger small mt-2 fw-bold">{errors.movies}</div> : null}

                  <div className="mt-4 p-3 bg-light rounded-3">
                    <h6 className="fw-bold small mb-2">
                      {isEdit ? "Xem trước danh sách áp dụng:" : "Tóm tắt áp dụng:"}
                    </h6>
                    <div className="d-flex flex-wrap gap-1">
                      {formData.selectedMovieIds.length > 0 ? (
                        formData.selectedMovieIds.map((mid) => (
                          <Badge key={mid} bg="primary" className="fw-normal">
                            {movies.find((m) => m.id === mid)?.title}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted small italic">
                          {isEdit ? "Vui lòng chọn ít nhất 1 phim" : "Chưa có phim nào được chọn"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="d-grid gap-2 mt-4 pt-3">
                    <Button type="submit" variant="primary" className="py-2 fw-bold shadow-sm rounded-3">
                      {isEdit ? "Lưu các thay đổi" : "Lưu và Phát hành khuyến mãi"}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      className="py-2 border-0"
                      onClick={() => navigate(`${prefix}/promotions`)}
                    >
                      {isEdit ? "Hủy bỏ & Quay lại" : "Hủy bỏ"}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

