import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { TenKH, Email, DienThoai, DiaChi, MatKhau } = req.body;

    // Simple validation
    if (!TenKH || !Email || !DienThoai || !DiaChi || !MatKhau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: TenKH, Email, DienThoai, DiaChi, MatKhau',
      });
    }

    const newUser = await authService.register({ TenKH, Email, DienThoai, DiaChi, MatKhau });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: newUser,
    });
  } catch (error) {
    if (error.message === 'Email đã được sử dụng.' || error.message === 'Tên đăng nhập đã tồn tại.') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tài khoản (username) và mật khẩu (password)',
      });
    }

    const result = await authService.login(username, password);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result,
    });
  } catch (error) {
    if (error.message === 'Sai tài khoản hoặc mật khẩu.') {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const username = req.user.username;
    const profile = await authService.getMe(username);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
