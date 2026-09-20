package com.example.backend.backtest;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;

public record BacktestRequest(
        @NotBlank(message = "Chọn mã cổ phiếu") @Pattern(regexp = "[A-Z0-9]{1,10}", message = "Mã cổ phiếu không hợp lệ") String symbol,
        @NotNull(message = "Chọn ngày bắt đầu") LocalDate from,
        @NotNull(message = "Chọn ngày kết thúc") LocalDate to,
        @NotNull(message = "Nhập vốn ban đầu") @DecimalMin(value = "1", message = "Vốn tối thiểu 1 VND")
        @DecimalMax(value = "1000000000000", message = "Vốn tối đa 1.000 tỷ VND")
        @Digits(integer = 13, fraction = 2, message = "Vốn có tối đa 2 chữ số thập phân") BigDecimal capital,
        @NotNull(message = "Nhập phí giao dịch") @DecimalMin(value = "0", message = "Phí không được âm")
        @DecimalMax(value = "5", message = "Phí tối đa 5% mỗi chiều")
        @Digits(integer = 1, fraction = 2, message = "Phí có tối đa 2 chữ số thập phân") BigDecimal feePercent) {
    public BacktestRequest {
        if (symbol != null) symbol = symbol.strip().toUpperCase(Locale.ROOT);
    }
}
