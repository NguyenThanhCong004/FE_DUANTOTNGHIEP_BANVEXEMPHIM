import React from 'react';

const ComboCard = ({ combo, qty = 0, onAdd, onRemove }) => {
  const discount = combo.originalPrice
    ? Math.round((1 - combo.price / combo.originalPrice) * 100)
    : null;

  return (
    <>
      <style>{`
        .combo-card {
          background: rgba(20,22,50,0.92);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px 14px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          height: 100%;
          overflow: hidden;
        }
        .combo-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #7b1fa2, #e91e8c);
          opacity: 0;
          transition: opacity 0.25s;
        }
        .combo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.45);
          border-color: rgba(212,226,25,0.2);
        }
        .combo-card:hover::before { opacity: 1; }
        .combo-card.in-cart {
          border-color: rgba(212,226,25,0.4);
        }
        .combo-card.in-cart::before {
          opacity: 1;
          background: #d4e219;
        }

        .combo-tag {
          position: absolute;
          top: 10px; left: 10px;
          background: linear-gradient(135deg, #7b1fa2, #e91e8c);
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 5px;
          font-family: 'Syne', sans-serif;
        }
        .combo-discount {
          position: absolute;
          top: 10px; right: 10px;
          background: rgba(233,30,140,0.15);
          border: 1px solid rgba(233,30,140,0.4);
          color: #e91e8c;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          font-family: 'Syne', sans-serif;
        }

        .combo-img-wrap {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          flex-shrink: 0;
        }
        .combo-img-wrap img {
          width: 60px;
          height: 60px;
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }

        .combo-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
          color: #fff;
          margin-bottom: 4px;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .combo-desc {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-weight: 600;
          margin-bottom: 10px;
          line-height: 1.4;
          flex: 1;
        }
        .combo-price-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .combo-price {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 1px;
          color: #d4e219;
        }
        .combo-original {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          text-decoration: line-through;
          font-weight: 600;
        }

        /* add / qty controls */
        .combo-add-btn {
          width: 100%;
          padding: 8px;
          border: none;
          border-radius: 9px;
          background: linear-gradient(135deg, #7b1fa2, #e91e8c);
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 0 14px rgba(233,30,140,0.2);
        }
        .combo-add-btn:hover { opacity: 0.88; transform: translateY(-1px); }

        .combo-qty-ctrl {
          display: flex;
          align-items: center;
          width: 100%;
          border-radius: 9px;
          overflow: hidden;
          border: 1.5px solid rgba(212,226,25,0.35);
        }
        .combo-qty-btn {
          background: rgba(212,226,25,0.1);
          border: none;
          color: #d4e219;
          font-size: 18px;
          font-weight: 700;
          width: 36px;
          height: 34px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
          line-height: 1;
        }
        .combo-qty-btn:hover { background: rgba(212,226,25,0.22); }
        .combo-qty-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 17px;
          color: #fff;
          letter-spacing: 1px;
          flex: 1;
          text-align: center;
          background: rgba(255,255,255,0.04);
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div className={`combo-card${qty > 0 ? ' in-cart' : ''}`}>
        {combo.tag && <div className="combo-tag">{combo.tag}</div>}
        {discount && <div className="combo-discount">-{discount}%</div>}

        <div className="combo-img-wrap">
          <img src={combo.img} alt={combo.name} />
        </div>

        <div className="combo-name">{combo.name}</div>
        <p className="combo-desc">{combo.desc}</p>

        <div className="combo-price-row">
          <span className="combo-price">{combo.price.toLocaleString('vi-VN')}đ</span>
          {combo.originalPrice && (
            <span className="combo-original">{combo.originalPrice.toLocaleString('vi-VN')}đ</span>
          )}
        </div>

        {/* Only show controls if handlers are provided (FoodOrder page) */}
        {onAdd ? (
          qty === 0 ? (
            <button className="combo-add-btn" onClick={() => onAdd(combo)}>
              + Thêm vào giỏ
            </button>
          ) : (
            <div className="combo-qty-ctrl">
              <button className="combo-qty-btn" onClick={() => onRemove(combo)}>−</button>
              <div className="combo-qty-num">{qty}</div>
              <button className="combo-qty-btn" onClick={() => onAdd(combo)}>+</button>
            </div>
          )
        ) : null}
      </div>
    </>
  );
};

export default ComboCard;