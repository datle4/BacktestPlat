package com.example.backend.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ProblemDetail> handleStatus(ResponseStatusException exception) {
        String detail = exception.getReason() == null ? "Yêu cầu không thể xử lý" : exception.getReason();
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(exception.getStatusCode(), detail);
        problem.setTitle(exception.getStatusCode().is4xxClientError() ? "Yêu cầu không hợp lệ" : "Lỗi máy chủ");
        return ResponseEntity.status(exception.getStatusCode()).body(problem);
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentNotValidException.class})
    ResponseEntity<ProblemDetail> handleBadRequest(Exception exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Kiểm tra lại mã cổ phiếu và ngày theo định dạng YYYY-MM-DD");
        problem.setTitle("Yêu cầu không hợp lệ");
        return ResponseEntity.badRequest().body(problem);
    }
}

