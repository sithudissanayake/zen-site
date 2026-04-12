package com.zenvora;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = { "com.zenvora", "com.delivery.backend" })
public class ZenvoraApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZenvoraApplication.class, args);
        System.out.println(" Zenvora Backend Started on http://localhost:8080/api/products");
    }
}