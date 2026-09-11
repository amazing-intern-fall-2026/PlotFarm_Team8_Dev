import * as contractRepository from '../repositories/contractRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { AppError } from '../utils/AppError.js';

export const createContract = async (payload, user) => {
    const { maODat, maCayTrong, soThangThue } = payload;
    
    // Validate inputs
    if (!maODat || !maCayTrong || !soThangThue || soThangThue <= 0) {
        throw new AppError('Dữ liệu không hợp lệ. Vui lòng cung cấp mã ô đất, mã cây trồng và số tháng thuê.', 400);
    }
    
    // User must be CUSTOMER
    if (user.role !== 'CUSTOMER') {
        throw new AppError('Chỉ Khách hàng mới có thể tạo hợp đồng.', 403);
    }

    return runInTransaction(async (transaction) => {
        // 1. Check Plot Availability
        const plot = await contractRepository.checkPlotAvailability(maODat, transaction);
        if (!plot) {
            throw new AppError('Không tìm thấy Ô Đất.', 404);
        }
        if (plot.TrangThai !== 'TRONG') {
            throw new AppError('Ô Đất này hiện không trống.', 400);
        }

        // 2. Check Crop Exists
        const crop = await contractRepository.checkCropExists(maCayTrong, transaction);
        if (!crop) {
            throw new AppError('Không tìm thấy Cây trồng.', 404);
        }

        // 3. Calculate Dates and Total Price
        const ngayBatDau = new Date();
        const ngayKetThuc = new Date();
        ngayKetThuc.setMonth(ngayKetThuc.getMonth() + soThangThue);
        
        const tongTien = plot.GiaThue * soThangThue;

        // 4. Update Plot Status
        await contractRepository.updatePlotStatus(maODat, 'DANG_THUE', transaction);

        // 5. Create Contract
        const contractData = {
            MaKH: user.userId, // Authenticated Customer ID
            MaODat: maODat,
            MaCayTrong: maCayTrong,
            NgayBatDau: ngayBatDau,
            NgayKetThuc: ngayKetThuc,
            TongTien: tongTien
        };
        
        const newContract = await contractRepository.createContract(contractData, transaction);
        return newContract;
    });
};
