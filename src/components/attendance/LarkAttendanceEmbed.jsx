import React from 'react';

// URL của Lark Base view bạn muốn nhúng
const LARK_EMBED_URL = "https://atino-vietnam.sg.larksuite.com/base/Ey3EbVD9vacAHvs8cVvlHxkKg2r?table=tblU9YY1t4TwxXLh&view=vewpWpbNQv";

const LarkAttendanceEmbed = () => {
  return (
    // Container đảm bảo iframe chiếm hết không gian được cấp và có chiều cao tối thiểu
    <div 
      className="h-full w-full" 
      style={{ minHeight: 'calc(100vh - 250px)' }} // Điều chỉnh chiều cao để phù hợp layout
    >
      <iframe
        src={LARK_EMBED_URL}
        title="Bảng Chấm Công từ Lark Base"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px' // Bo góc cho iframe
        }}
        loading="lazy"
        allow="fullscreen"
      >
        Trình duyệt của bạn không hỗ trợ iframe.
      </iframe>
    </div>
  );
};

export default LarkAttendanceEmbed;
